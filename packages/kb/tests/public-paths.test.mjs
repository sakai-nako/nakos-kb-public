import assert from 'node:assert/strict';
import test from 'node:test';
import { chapterPath, novelPath, resolveChapterSlug } from '../src/shared/public-paths.ts';

test('cadenza chapters keep the legacy public paths', () => {
  assert.equal(novelPath('cadenza-engineering'), '/novels/cadenza-engineering');
  assert.equal(
    chapterPath('cadenza-engineering', 'cadenza-engineering-01-not-on-the-symbols'),
    '/novels/cadenza-engineering/01-not-on-the-symbols',
  );
  assert.equal(
    chapterPath('cadenza-engineering', 'cadenza-engineering-02-as-a-gift'),
    '/novels/cadenza-engineering/02-as-a-gift',
  );
  assert.equal(
    chapterPath('cadenza-engineering', 'cadenza-engineering-03-meaning-in-the-numbers'),
    '/novels/cadenza-engineering/03-meaning-in-the-numbers',
  );
  const item = {
    slug: 'cadenza-engineering',
    chapters: [{ slug: 'cadenza-engineering-01-not-on-the-symbols' }],
  };
  assert.equal(
    resolveChapterSlug(item, '01-not-on-the-symbols'),
    'cadenza-engineering-01-not-on-the-symbols',
  );
});

test('a novel without an alias keeps its bundle slug', () => {
  assert.equal(novelPath('fixture-work'), '/novels/fixture-work');
  assert.equal(chapterPath('fixture-work', 'one-oh-one'), '/novels/fixture-work/one-oh-one');
  const item = { slug: 'fixture-work', chapters: [{ slug: 'one-oh-one' }] };
  assert.equal(resolveChapterSlug(item, 'one-oh-one'), 'one-oh-one');
});
