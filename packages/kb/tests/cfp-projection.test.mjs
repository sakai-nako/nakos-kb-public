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
  title: `CFP ${id}`,
  status: 'submitted',
  submitted_at: '2026-06-28',
  event: '2026-10-12-fixture-event',
  url: 'https://example.com/proposal',
  target_audience: null,
  hook: null,
  tags: ['fsd'],
  body: '## トークタイトル\n\n本文\n',
  drafts: null,
  ...extra,
});
function cfpBundle(entries, overrides = {}) {
  const source = {
    kind: 'vault',
    work_id: '11111111-1111-4111-8111-111111111111',
    generation: '22222222-2222-4222-8222-222222222222',
    snapshot_revision: revision({ kind: 'cfp', entries }),
    ...overrides,
  };
  const unsigned = { schema_version: 2, kind: 'cfp', entries, source };
  return { ...unsigned, projection_revision: revision(unsigned) };
}

test('validates a cfp bundle and derives index and drafts files', () => {
  const entries = [
    entry('2026-01-01-a', { drafts: { title: '校正過程: a', body: '### Round 1\n' } }),
    entry('2026-02-02-b'),
  ];
  const bundle = cfpBundle(entries);
  const valid = validate(bundle);
  assert.equal(bundleKey(valid), 'cfp');
  assert.equal(defaultDestination(valid), 'src/content');
  const { slug, files } = projectionFiles(bundle);
  assert.equal(slug, 'cfp');
  assert.deepEqual(
    [...files.keys()],
    ['2026-01-01-a/index.md', '2026-01-01-a/drafts.md', '2026-02-02-b/index.md'],
  );
  const { id: _i, body, drafts: _d, ...meta } = entries[0];
  assert.equal(files.get('2026-01-01-a/index.md'), `---\n${canonical(meta)}\n---\n${body}`);
  assert.equal(
    files.get('2026-01-01-a/drafts.md'),
    `---\n${canonical({ title: '校正過程: a' })}\n---\n### Round 1\n`,
  );
});

test('rejects bad status, date, url, event id, order, and empty body', () => {
  const ok = [entry('2026-01-01-a')];
  const bad = (patch) => cfpBundle([{ ...ok[0], ...patch }]);
  assert.throws(() => validate(bad({ status: 'draft' })), /status/);
  assert.throws(() => validate(bad({ submitted_at: '2026/06/28' })), /submitted_at/);
  assert.throws(() => validate(bad({ url: 'javascript:alert(1)' })), /url/);
  assert.throws(() => validate(bad({ event: '../x' })), /event/);
  assert.throws(() => validate(bad({ body: '' })), /body/);
  assert.throws(() => validate(bad({ drafts: { title: '', body: 'x' } })), /drafts/);
  const unsorted = [entry('2026-02-02-b'), entry('2026-01-01-a')];
  assert.throws(() => validate(cfpBundle(unsorted)), /entries order/);
});

test('review and apply replace the cfp directory', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-cfp-'));
  try {
    const authority = path.join(dir, 'publication-authority.json');
    fs.writeFileSync(authority, JSON.stringify({ schema_version: 1, works: {} }));
    registerWork(authority, 'cfp', '11111111-1111-4111-8111-111111111111', 'vault');
    const generation = JSON.parse(fs.readFileSync(authority, 'utf8')).works.cfp.generation;
    const bundle = cfpBundle([entry('2026-01-01-a', { drafts: { title: 't', body: 'b\n' } })], {
      generation,
    });
    const destination = path.join(dir, 'src/content');
    const r = reviewProjection(
      bundle,
      destination,
      path.join(dir, '.projection-review'),
      authority,
    );
    assert.equal(r.entry_count, 1);
    applyProjection(bundle, r.receipt, destination, authority);
    assert.deepEqual(fs.readdirSync(path.join(destination, 'cfp/2026-01-01-a')).sort(), [
      'drafts.md',
      'index.md',
    ]);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
