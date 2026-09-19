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

const entry = (id, name) => ({
  id,
  event_name: name,
  start_datetime: '2026-05-14T01:00:00Z',
  end_datetime: '2026-05-15T09:00:00Z',
  event_link: 'https://example.com/event',
  how_relate: ['speaker'],
  materials: [
    { title: '資料', url: 'https://example.com/deck', platform: 'slidev', presented_at: null },
  ],
});
function eventsBundle(entries, source) {
  const unsigned = { schema_version: 2, kind: 'events', entries, source };
  return { ...unsigned, projection_revision: revision(unsigned) };
}
function sourceFor(entries, entryOverrides = {}) {
  return {
    kind: 'vault',
    work_id: '11111111-1111-4111-8111-111111111111',
    generation: '22222222-2222-4222-8222-222222222222',
    snapshot_revision: revision({ kind: 'events', entries }),
    ...entryOverrides,
  };
}
function authorityIn(dir) {
  const file = path.join(dir, 'publication-authority.json');
  fs.writeFileSync(file, JSON.stringify({ schema_version: 1, works: {} }));
  return file;
}

test('validates an events bundle and derives projection files', () => {
  const entries = [entry('2026-01-01-a', 'A'), entry('2026-02-02-b', 'B')];
  const bundle = eventsBundle(entries, sourceFor(entries));
  const valid = validate(bundle);
  assert.equal(bundleKey(valid), 'events');
  assert.equal(defaultDestination(valid), 'src/content');
  const { slug, files } = projectionFiles(bundle);
  assert.equal(slug, 'events');
  assert.deepEqual([...files.keys()], ['2026-01-01-a.md', '2026-02-02-b.md']);
  const { id: _id, ...rest } = entries[0];
  assert.equal(files.get('2026-01-01-a.md'), `---\n${canonical(rest)}\n---\n`);
});

test('rejects unsorted, duplicate, malformed, and unsafe events', () => {
  const sorted = [entry('2026-01-01-a', 'A'), entry('2026-02-02-b', 'B')];
  const unsorted = [sorted[1], sorted[0]];
  assert.throws(() => validate(eventsBundle(unsorted, sourceFor(unsorted))), /entries order/);
  const dup = [sorted[0], sorted[0]];
  assert.throws(() => validate(eventsBundle(dup, sourceFor(dup))), /entry id/);
  const badDate = [{ ...sorted[0], end_datetime: '2025-01-01T00:00:00Z' }];
  assert.throws(() => validate(eventsBundle(badDate, sourceFor(badDate))), /datetime/);
  const badUrl = [{ ...sorted[0], event_link: 'javascript:alert(1)' }];
  assert.throws(() => validate(eventsBundle(badUrl, sourceFor(badUrl))), /url/);
  const badPlatform = [
    {
      ...sorted[0],
      materials: [{ title: 'x', url: 'https://e.com', platform: 'youtube', presented_at: null }],
    },
  ];
  assert.throws(() => validate(eventsBundle(badPlatform, sourceFor(badPlatform))), /material/);
  const extraKey = [{ ...sorted[0], body: 'x' }];
  assert.throws(() => validate(eventsBundle(extraKey, sourceFor(extraKey))), /entry keys/);
  const badId = [{ ...sorted[0], id: '../escape' }];
  assert.throws(() => validate(eventsBundle(badId, sourceFor(badId))), /entry id/);
  assert.throws(
    () => validate({ ...eventsBundle(sorted, sourceFor(sorted)), kind: 'unknown' }),
    /kind/,
  );
});

test('review and apply replace the whole events directory atomically', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-events-'));
  try {
    const authority = authorityIn(dir);
    registerWork(authority, 'events', '11111111-1111-4111-8111-111111111111', 'vault');
    const generation = JSON.parse(fs.readFileSync(authority, 'utf8')).works.events.generation;
    const first = [entry('2026-01-01-a', 'A'), entry('2026-02-02-b', 'B')];
    const bundle1 = eventsBundle(first, sourceFor(first, { generation }));
    const destination = path.join(dir, 'src/content');
    const reviews = path.join(dir, '.projection-review');
    const r1 = reviewProjection(bundle1, destination, reviews, authority);
    assert.equal(r1.entry_count, 2);
    assert.equal(fs.existsSync(path.join(destination, 'events')), false);
    applyProjection(bundle1, r1.receipt, destination, authority);
    assert.deepEqual(fs.readdirSync(path.join(destination, 'events')).sort(), [
      '2026-01-01-a.md',
      '2026-02-02-b.md',
    ]);
    const second = [entry('2026-02-02-b', 'B2')];
    const bundle2 = eventsBundle(second, sourceFor(second, { generation }));
    const r2 = reviewProjection(bundle2, destination, reviews, authority);
    applyProjection(bundle2, r2.receipt, destination, authority);
    assert.deepEqual(fs.readdirSync(path.join(destination, 'events')), ['2026-02-02-b.md']);
    assert.match(
      fs.readFileSync(path.join(destination, 'events/2026-02-02-b.md'), 'utf8'),
      /"event_name":"B2"/,
    );
    assert.equal(fs.existsSync(reviews) && fs.readdirSync(reviews).length, 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('novel bundles keep working without a kind field', () => {
  const novel = { title: '作品', slug: 'work', status: 'ongoing', synopsis: '' };
  const chapters = [{ title: '一', slug: 'first', sequence: 1, body: '本文' }];
  const unsigned = { schema_version: 1, novel, chapters };
  const bundle = { ...unsigned, projection_revision: revision(unsigned) };
  assert.equal(bundleKey(validate(bundle)), 'work');
  assert.equal(defaultDestination(bundle), 'src/content/novels');
});
