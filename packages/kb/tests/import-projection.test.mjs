import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { importProjection, validate } from '../scripts/import-projection.mjs';
import { applyProjection, reviewProjection } from '../scripts/projection-workflow.mjs';
import {
  freezeWork,
  registerWork,
  revision,
  snapshotRevision,
  withPublicationAuthority,
} from '../scripts/publication-authority.mjs';

function canonical(value) {
  return Array.isArray(value)
    ? `[${value.map(canonical).join(',')}]`
    : value && typeof value === 'object'
      ? `{${Object.keys(value)
          .sort()
          .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
          .join(',')}}`
      : JSON.stringify(value);
}
function bundle() {
  const value = {
    schema_version: 1,
    novel: {
      title: '作品',
      slug: 'work',
      status: 'ongoing',
      synopsis: '一行目\ncolon: value と "quote" と \\backslash',
    },
    chapters: [
      { title: '第二章', slug: 'second', sequence: 2, body: '本文2' },
      {
        title: '第一章',
        slug: 'first',
        sequence: 1,
        body: `${'長文'.repeat(
          20_000,
        )}\n---\n|漢字《かんじ》と《《傍点》》\n<script>unsafe</script>`,
      },
    ],
  };
  return {
    ...value,
    projection_revision: crypto.createHash('sha256').update(canonical(value), 'utf8').digest('hex'),
  };
}
function signed(value) {
  return {
    ...value,
    projection_revision: crypto.createHash('sha256').update(canonical(value), 'utf8').digest('hex'),
  };
}
function testAuthority(directory) {
  const authority = path.join(directory, 'publication-authority.json');
  if (!fs.existsSync(authority)) {
    fs.writeFileSync(authority, '{"schema_version":1,"works":{}}\n', 'utf8');
  }
  return authority;
}
test('preserves escaped metadata and long literal bodies without affecting other novels', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-test-'));
  fs.mkdirSync(path.join(dir, 'other'));
  fs.writeFileSync(path.join(dir, 'other', 'keep.md'), 'keep');
  importProjection(bundle(), dir, testAuthority(dir));
  const index = fs.readFileSync(path.join(dir, 'work', 'index.md'), 'utf8');
  const chapter = fs.readFileSync(path.join(dir, 'work', '01-first.md'), 'utf8');
  assert.equal(
    index,
    `---\n{"status":"ongoing","synopsis":"一行目\\ncolon: value と \\"quote\\" と \\\\backslash","title":"作品"}\n---\n`,
  );
  assert.equal(chapter.endsWith(bundle().chapters[1].body), true);
  assert.equal(
    chapter.includes('\n---\n|漢字《かんじ》と《《傍点》》\n<script>unsafe</script>'),
    true,
  );
  assert.equal(fs.existsSync(path.join(dir, 'other', 'keep.md')), true);
  const reduced = bundle();
  reduced.chapters = [reduced.chapters[1]];
  const unsigned = {
    schema_version: reduced.schema_version,
    novel: reduced.novel,
    chapters: reduced.chapters,
  };
  reduced.projection_revision = crypto
    .createHash('sha256')
    .update(canonical(unsigned), 'utf8')
    .digest('hex');
  importProjection(reduced, dir, testAuthority(dir));
  assert.equal(fs.existsSync(path.join(dir, 'work', '02-second.md')), false);
  importProjection(reduced, dir, testAuthority(dir));
  assert.deepEqual(fs.readdirSync(path.join(dir, 'work')).sort(), ['01-first.md', 'index.md']);
  fs.rmSync(dir, { recursive: true });
});
test('writes three and four digit chapter sequences without changing numeric metadata', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-high-sequence-test-'));
  const value = signed({
    schema_version: 1,
    novel: { title: '高い章順の作品', slug: 'high-sequence', status: 'ongoing', synopsis: '' },
    chapters: [
      { title: '第千章', slug: 'thousand', sequence: 1000, body: '1000本文' },
      { title: '第百一章', slug: 'one-oh-one', sequence: 101, body: '101本文' },
      { title: '第百章', slug: 'one-hundred', sequence: 100, body: '100本文' },
      { title: '第九十九章', slug: 'ninety-nine', sequence: 99, body: '99本文' },
    ],
  });
  importProjection(value, dir, testAuthority(dir));
  assert.deepEqual(fs.readdirSync(path.join(dir, 'high-sequence')).sort(), [
    '100-one-hundred.md',
    '1000-thousand.md',
    '101-one-oh-one.md',
    '99-ninety-nine.md',
    'index.md',
  ]);
  assert.match(
    fs.readFileSync(path.join(dir, 'high-sequence', '1000-thousand.md'), 'utf8'),
    /^---\n\{"sequence":1000,"slug":"thousand","title":"第千章"\}\n---\n1000本文$/,
  );
  fs.rmSync(dir, { recursive: true });
});
test('rejects stale digest, invalid metadata, traversal, and all ATX headings', () => {
  for (const mutate of [
    (v) => (v.projection_revision = '0'.repeat(64)),
    (v) => (v.extra = true),
    (v) => (v.novel.slug = '../bad'),
    (v) => (v.novel.status = 'published'),
    (v) => (v.novel.title = '  '),
    (v) => (v.chapters[0].body = ''),
    (v) => (v.chapters[0].slug = v.chapters[1].slug),
    (v) => (v.chapters[0].sequence = v.chapters[1].sequence),
    ...[1, 2, 3, 4, 5, 6].map(
      (level) => (v) => (v.chapters[0].body = `  ${'#'.repeat(level)} heading`),
    ),
    (v) => (v.chapters[0].body = '#'),
  ]) {
    const value = bundle();
    mutate(value);
    assert.throws(() => validate(value));
  }
});
test('runs the importer CLI and keeps projection text out of output', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-cli-test-'));
  const source = path.join(dir, 'projection.json');
  const destination = path.join(dir, 'content');
  fs.writeFileSync(source, JSON.stringify(bundle()), 'utf8');
  const result = spawnSync(
    Deno.execPath(),
    ['run', '-A', 'scripts/import-projection.mjs', source, destination, testAuthority(dir)],
    {
      cwd: path.resolve(import.meta.dirname, '..'),
      encoding: 'utf8',
    },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(destination, 'work', 'index.md')), true);
  assert.equal(fs.existsSync(path.join(destination, 'work', '01-first.md')), true);
  assert.equal(`${result.stdout}${result.stderr}`.includes(bundle().chapters[1].body), false);
  fs.writeFileSync(source, '{invalid', 'utf8');
  const invalid = spawnSync(
    Deno.execPath(),
    ['run', '-A', 'scripts/import-projection.mjs', source, destination, testAuthority(dir)],
    {
      cwd: path.resolve(import.meta.dirname, '..'),
      encoding: 'utf8',
    },
  );
  assert.notEqual(invalid.status, 0);
  fs.rmSync(dir, { recursive: true });
});
test('reviews without changing published files then applies only the reviewed target', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-review-test-'));
  const destination = path.join(dir, 'content');
  const reviews = path.join(dir, 'reviews');
  const target = path.join(destination, 'work');
  fs.mkdirSync(target, { recursive: true });
  fs.writeFileSync(path.join(target, 'old.md'), 'old');
  fs.mkdirSync(path.join(destination, 'other'), { recursive: true });
  fs.writeFileSync(path.join(destination, 'other', 'keep.md'), 'keep');
  const review = reviewProjection(bundle(), destination, reviews, testAuthority(dir));
  assert.equal(fs.readFileSync(path.join(target, 'old.md'), 'utf8'), 'old');
  assert.equal(fs.existsSync(review.receipt), true);
  assert.equal(
    applyProjection(bundle(), review.receipt, destination, testAuthority(dir)).applied,
    true,
  );
  assert.equal(fs.existsSync(path.join(destination, 'other', 'keep.md')), true);
  assert.equal(fs.existsSync(review.receipt), false);
  const reduced = signed({
    schema_version: 1,
    novel: bundle().novel,
    chapters: [bundle().chapters[1]],
  });
  const reducedReview = reviewProjection(reduced, destination, reviews, testAuthority(dir));
  applyProjection(reduced, reducedReview.receipt, destination, testAuthority(dir));
  assert.equal(fs.existsSync(path.join(target, '02-second.md')), false);
  const noopReview = reviewProjection(reduced, destination, reviews, testAuthority(dir));
  assert.equal(
    applyProjection(reduced, noopReview.receipt, destination, testAuthority(dir)).applied,
    false,
  );
  fs.rmSync(dir, { recursive: true });
});
test('rejects stale or tampered reviews and ineligible metadata', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-review-reject-'));
  const destination = path.join(dir, 'content');
  const stale = reviewProjection(
    bundle(),
    destination,
    path.join(dir, 'stale-reviews'),
    testAuthority(dir),
  );
  fs.mkdirSync(path.join(destination, 'work'), { recursive: true });
  fs.writeFileSync(path.join(destination, 'work', 'changed.md'), 'changed');
  assert.throws(() => applyProjection(bundle(), stale.receipt, destination, testAuthority(dir)));
  const tampered = reviewProjection(
    bundle(),
    path.join(dir, 'other-content'),
    path.join(dir, 'tampered-reviews'),
    testAuthority(dir),
  );
  const candidate = path.join(path.dirname(tampered.receipt), 'candidate', 'work', 'index.md');
  fs.appendFileSync(candidate, 'tampered');
  assert.throws(() =>
    applyProjection(
      bundle(),
      tampered.receipt,
      path.join(dir, 'other-content'),
      testAuthority(dir),
    ),
  );
  const privateMetadata = bundle();
  privateMetadata.novel.visibility = 'private';
  assert.throws(() =>
    reviewProjection(
      privateMetadata,
      destination,
      path.join(dir, 'invalid-reviews'),
      testAuthority(dir),
    ),
  );
  fs.rmSync(dir, { recursive: true });
});
test('runs review and apply CLIs without logging projection content', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-workflow-cli-'));
  const source = path.join(dir, 'projection.json');
  const destination = path.join(dir, 'content');
  const reviews = path.join(dir, 'reviews');
  fs.writeFileSync(source, JSON.stringify(bundle()), 'utf8');
  const review = spawnSync(
    Deno.execPath(),
    [
      'run',
      '-A',
      'scripts/projection-workflow.mjs',
      'review',
      source,
      destination,
      reviews,
      testAuthority(dir),
    ],
    { cwd: path.resolve(import.meta.dirname, '..'), encoding: 'utf8' },
  );
  assert.equal(review.status, 0, review.stderr);
  assert.equal(fs.existsSync(path.join(destination, 'work')), false);
  assert.equal(`${review.stdout}${review.stderr}`.includes(bundle().chapters[1].body), false);
  const receipt = path.join(reviews, bundle().projection_revision, 'receipt.json');
  const apply = spawnSync(
    Deno.execPath(),
    [
      'run',
      '-A',
      'scripts/projection-workflow.mjs',
      'apply',
      source,
      receipt,
      destination,
      testAuthority(dir),
    ],
    { cwd: path.resolve(import.meta.dirname, '..'), encoding: 'utf8' },
  );
  assert.equal(apply.status, 0, apply.stderr);
  assert.equal(fs.existsSync(path.join(destination, 'work', 'index.md')), true);
  fs.writeFileSync(source, '{invalid', 'utf8');
  const invalid = spawnSync(
    Deno.execPath(),
    [
      'run',
      '-A',
      'scripts/projection-workflow.mjs',
      'review',
      source,
      destination,
      reviews,
      testAuthority(dir),
    ],
    { cwd: path.resolve(import.meta.dirname, '..'), encoding: 'utf8' },
  );
  assert.notEqual(invalid.status, 0);
  fs.rmSync(dir, { recursive: true });
});
test('accepts the active v2 authority and rejects legacy, mismatched, frozen, stale, and locked paths', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-authority-test-'));
  const authority = path.join(dir, 'publication-authority.json');
  fs.writeFileSync(authority, '{"schema_version":1,"works":{}}\n', 'utf8');
  const workId = '11111111-1111-4111-8111-111111111111';
  registerWork(authority, 'work', workId, 'vault');
  const entry = JSON.parse(fs.readFileSync(authority, 'utf8')).works.work;
  const legacy = bundle();
  const value = {
    schema_version: 2,
    novel: legacy.novel,
    chapters: legacy.chapters,
    source: {
      kind: 'vault',
      work_id: workId,
      generation: entry.generation,
      snapshot_revision: snapshotRevision(legacy.novel, legacy.chapters),
    },
  };
  const v2 = { ...value, projection_revision: revision(value) };
  const destination = path.join(dir, 'content');
  importProjection(v2, destination, authority);
  assert.equal(fs.existsSync(path.join(destination, 'work', 'index.md')), true);
  assert.throws(() => importProjection(legacy, destination, authority), /legacy bundle/);
  const mismatchValue = structuredClone(value);
  mismatchValue.source.work_id = '22222222-2222-4222-8222-222222222222';
  const mismatch = { ...mismatchValue, projection_revision: revision(mismatchValue) };
  assert.throws(() => importProjection(mismatch, destination, authority), /source mismatch/);
  const review = reviewProjection(v2, destination, path.join(dir, 'reviews'), authority);
  registerWork(authority, 'other-work', '33333333-3333-4333-8333-333333333333', 'db');
  assert.throws(
    () => applyProjection(v2, review.receipt, destination, authority),
    /authority changed/,
  );
  freezeWork(authority, 'work');
  assert.throws(() => importProjection(v2, destination, authority), /work frozen/);
  const held = withPublicationAuthority(authority, 'work', async () => {
    assert.throws(() => withPublicationAuthority(authority, 'work', () => {}), /lock held/);
    return 'released';
  });
  assert.equal(await held, 'released');
  fs.rmSync(dir, { recursive: true });
});
