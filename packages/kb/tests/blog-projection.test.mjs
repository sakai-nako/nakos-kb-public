import assert from 'node:assert/strict';
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

const entry = (id, extra = {}) => ({
  id,
  title: `Blog ${id}`,
  description: `${id} の紹介文`,
  pubDate: '2026-04-13',
  tags: ['ai'],
  body: '## はじめに\n\n本文\n',
  ...extra,
});
function blogBundle(entries, overrides = {}) {
  const source = {
    kind: 'vault',
    work_id: '11111111-1111-4111-8111-111111111111',
    generation: '22222222-2222-4222-8222-222222222222',
    snapshot_revision: revision({ kind: 'blog', entries }),
    ...overrides,
  };
  const unsigned = { schema_version: 2, kind: 'blog', entries, source };
  return { ...unsigned, projection_revision: revision(unsigned) };
}

test('validates a blog bundle and derives one markdown file per entry', () => {
  const entries = [entry('2026-01-01-a'), entry('2026-02-02-b', { tags: [] })];
  const bundle = blogBundle(entries);
  const valid = validate(bundle);
  assert.equal(bundleKey(valid), 'blog');
  assert.equal(defaultDestination(valid), 'src/content');
  const { slug, files } = projectionFiles(bundle);
  assert.equal(slug, 'blog');
  assert.deepEqual([...files.keys()], ['2026-01-01-a.md', '2026-02-02-b.md']);
  const { id: _i, body, ...meta } = entries[0];
  assert.equal(files.get('2026-01-01-a.md'), `---\n${canonical(meta)}\n---\n${body}`);
});

test('rejects bad pubDate, empty description, empty tag, and order violations', () => {
  const ok = entry('2026-01-01-a');
  const bad = (patch) => blogBundle([{ ...ok, ...patch }]);
  assert.throws(() => validate(bad({ pubDate: '2026/04/13' })), /pubDate/);
  assert.throws(() => validate(bad({ description: '  ' })), /description/);
  assert.throws(() => validate(bad({ tags: ['ai', ''] })), /tags/);
  const unsorted = [entry('2026-02-02-b'), entry('2026-01-01-a')];
  assert.throws(() => validate(blogBundle(unsorted)), /entries order/);
});

test('review and apply replace the blog directory', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-blog-'));
  try {
    const authority = path.join(dir, 'publication-authority.json');
    fs.writeFileSync(authority, JSON.stringify({ schema_version: 1, works: {} }));
    registerWork(authority, 'blog', '11111111-1111-4111-8111-111111111111', 'vault');
    const generation = JSON.parse(fs.readFileSync(authority, 'utf8')).works.blog.generation;
    const bundle = blogBundle([entry('2026-01-01-a')], { generation });
    const destination = path.join(dir, 'src/content');
    const r = reviewProjection(
      bundle,
      destination,
      path.join(dir, '.projection-review'),
      authority,
    );
    assert.equal(r.entry_count, 1);
    applyProjection(bundle, r.receipt, destination, authority);
    assert.deepEqual(fs.readdirSync(path.join(destination, 'blog')), ['2026-01-01-a.md']);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
