import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  bundleKey,
  defaultDestination,
  projectionFiles,
  validate,
} from '../scripts/import-projection.mjs';
import { applyProjection, reviewProjection } from '../scripts/projection-workflow.mjs';
import { canonical, registerWork, revision } from '../scripts/publication-authority.mjs';

// 1x1 の合成 PNG。実データは使わず、テストのたびにこのリテラルから Buffer を起こす。
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
const sha = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const text = (file, content) => ({
  path: file,
  encoding: 'utf8',
  content,
  sha256: sha(Buffer.from(content, 'utf8')),
});
const binary = (file, bytes) => ({
  path: file,
  encoding: 'base64',
  content: bytes.toString('base64'),
  sha256: sha(bytes),
});
const indexMd = '---\ntitle: 合成デッキ\ntheme: seriph\n---\n\n# 1 枚目\n';
const style = '.slidev-layout {\n  text-align: left;\n}\n';
const files = () => [
  binary('images/a.png', png),
  text('index.md', indexMd),
  text('style.css', style),
];
const deck = (id, overrides = {}) => ({
  id,
  meta: {
    title: '合成デッキ',
    event: '2026-01-01-fixture-a',
    eventName: '合成イベント',
    eventDate: '2026-01-01',
    ...(overrides.meta ?? {}),
  },
  files: overrides.files ?? files(),
});
function slidesBundle(entries, overrides = {}) {
  const source = {
    kind: 'vault',
    work_id: '11111111-1111-4111-8111-111111111111',
    generation: '22222222-2222-4222-8222-222222222222',
    snapshot_revision: revision({ kind: 'slides', entries }),
    ...overrides,
  };
  const unsigned = { schema_version: 2, kind: 'slides', entries, source };
  return { ...unsigned, projection_revision: revision(unsigned) };
}

test('validates a slides bundle and derives deck files with meta.json', () => {
  const entries = [deck('2026-01-01-fixture-deck'), deck('2026-02-02-later-deck')];
  const bundle = slidesBundle(entries);
  const valid = validate(bundle);
  assert.equal(bundleKey(valid), 'slides');
  assert.equal(defaultDestination(valid), 'src/content');
  const { slug, files: projected } = projectionFiles(bundle);
  assert.equal(slug, 'slides');
  assert.deepEqual([...projected.keys()].sort(), [
    '2026-01-01-fixture-deck/images/a.png',
    '2026-01-01-fixture-deck/index.md',
    '2026-01-01-fixture-deck/meta.json',
    '2026-01-01-fixture-deck/style.css',
    '2026-02-02-later-deck/images/a.png',
    '2026-02-02-later-deck/index.md',
    '2026-02-02-later-deck/meta.json',
    '2026-02-02-later-deck/style.css',
  ]);
  assert.equal(
    projected.get('2026-01-01-fixture-deck/meta.json'),
    `${canonical(entries[0].meta)}\n`,
  );
  assert.equal(projected.get('2026-01-01-fixture-deck/index.md'), indexMd);
  const image = projected.get('2026-01-01-fixture-deck/images/a.png');
  assert.ok(image instanceof Uint8Array);
  assert.equal(Buffer.compare(Buffer.from(image), png), 0);
});

test('rejects unsafe paths, reserved names, bad digests, and order violations', () => {
  const ok = deck('2026-01-01-fixture-deck');
  const withFiles = (list) => slidesBundle([{ ...ok, files: list }]);
  const index = text('index.md', indexMd);
  assert.throws(() => validate(withFiles([index, text('images/../escape.md', 'x')])), /file path/);
  assert.throws(() => validate(withFiles([text('_notes.md', 'x'), index])), /file path/);
  assert.throws(() => validate(withFiles([text('components/x.vue', 'x'), index])), /file path/);
  assert.throws(() => validate(withFiles([index, text('meta.json', '{}')])), /file path/);
  assert.throws(
    () => validate(withFiles([{ ...index, sha256: sha(Buffer.from('other', 'utf8')) }])),
    /file digest/,
  );
  assert.throws(() => validate(withFiles([text('style.css', style)])), /index\.md/);
  assert.throws(() => validate(withFiles([text('style.css', style), index])), /files order/);
  assert.throws(() => validate(withFiles([index, index])), /files order/);
  assert.throws(
    () => validate(withFiles([{ ...binary('images/a.png', png), content: 'iVBORw=' }, index])),
    /file content/,
  );
  assert.throws(() => validate(withFiles([text('index.md', 'title: 合成\n')])), /index\.md/);
  const unsorted = [deck('2026-02-02-later-deck'), deck('2026-01-01-fixture-deck')];
  assert.throws(() => validate(slidesBundle(unsorted)), /entries order/);
  assert.throws(
    () => validate(slidesBundle([deck('2026-01-01-fixture-deck', { meta: { duration: 30 } })])),
    /meta keys/,
  );
});

test('review and apply place deck files, including binaries, byte for byte', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-slides-'));
  try {
    const authority = path.join(dir, 'publication-authority.json');
    fs.writeFileSync(authority, JSON.stringify({ schema_version: 1, works: {} }));
    registerWork(authority, 'slides', '11111111-1111-4111-8111-111111111111', 'vault');
    const generation = JSON.parse(fs.readFileSync(authority, 'utf8')).works.slides.generation;
    const bundle = slidesBundle([deck('2026-01-01-fixture-deck')], { generation });
    const destination = path.join(dir, 'src/content');
    const reviews = path.join(dir, '.projection-review');
    const review = reviewProjection(bundle, destination, reviews, authority);
    assert.equal(review.entry_count, 1);
    assert.equal(applyProjection(bundle, review.receipt, destination, authority).applied, true);
    const root = path.join(destination, 'slides/2026-01-01-fixture-deck');
    assert.deepEqual(fs.readdirSync(root).sort(), ['images', 'index.md', 'meta.json', 'style.css']);
    assert.equal(Buffer.compare(fs.readFileSync(path.join(root, 'images/a.png')), png), 0);
    assert.equal(fs.readFileSync(path.join(root, 'index.md'), 'utf8'), indexMd);
    assert.equal(
      JSON.parse(fs.readFileSync(path.join(root, 'meta.json'), 'utf8')).eventDate,
      '2026-01-01',
    );
    assert.equal(fs.readdirSync(reviews).length, 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('keeps the tree digest of a text-only projection unchanged', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-slides-novel-'));
  try {
    const authority = path.join(dir, 'publication-authority.json');
    fs.writeFileSync(authority, JSON.stringify({ schema_version: 1, works: {} }));
    const novel = { title: '合成作品', slug: 'fixture-work', status: 'ongoing', synopsis: '概要' };
    const chapters = [{ title: '第一章', slug: 'first', sequence: 1, body: '本文\n' }];
    const unsigned = { schema_version: 1, novel, chapters };
    const bundle = { ...unsigned, projection_revision: revision(unsigned) };
    const review = reviewProjection(
      bundle,
      path.join(dir, 'src/content/novels'),
      path.join(dir, '.projection-review'),
      authority,
    );
    // バイト読みへ切り替えても、UTF-8 のテキストだけの候補は同じ digest になる。
    assert.equal(
      JSON.parse(fs.readFileSync(review.receipt, 'utf8')).candidate_tree_digest,
      'e106b2ca7b9893e976edcc39a40409f24e74c296359584ee51fab72bb0a47ce4',
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
