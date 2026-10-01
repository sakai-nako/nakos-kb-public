import assert from 'node:assert/strict';
import test from 'node:test';
import { isTalk, presentations, roleLabel } from '../src/shared/event-view.ts';

test('names each role in Japanese and keeps an unknown role as it is', () => {
  assert.deepEqual(['speaker', 'organizer', 'cfp_submitter', 'attendee', 'judge'].map(roleLabel), [
    '登壇',
    '運営',
    'CfP 応募',
    '参加',
    'judge',
  ]);
});

test('treats an event as a talk only when the roles include speaker', () => {
  assert.equal(isTalk({ how_relate: ['attendee', 'speaker'] }), true);
  assert.equal(isTalk({ how_relate: ['organizer', 'cfp_submitter'] }), false);
  assert.equal(isTalk({ how_relate: [] }), false);
});

test('lists the site decks first and drops materials that point to the same deck', () => {
  const material = (title, url, platform = null) => ({ title, url, platform, presented_at: null });
  const items = presentations(
    [
      material('同じデッキ', 'https://example.invalid/slides/2026-01-01-deck/', 'slidev'),
      material('外部の資料', 'https://example.invalid/external', 'docswell'),
      material('末尾の / が無い同じデッキ', 'https://example.invalid/slides/2026-01-01-deck'),
    ],
    [{ title: '合成デッキ', href: '/slides/2026-01-01-deck/' }],
  );

  assert.deepEqual(items, [
    { title: '合成デッキ', href: '/slides/2026-01-01-deck/', platform: null },
    { title: '外部の資料', href: 'https://example.invalid/external', platform: 'docswell' },
  ]);
});

test('keeps every material when the event has no site deck', () => {
  const items = presentations(
    [{ title: '外部の資料', url: 'https://example.invalid/a', platform: null, presented_at: null }],
    [],
  );
  assert.deepEqual(items, [
    { title: '外部の資料', href: 'https://example.invalid/a', platform: null },
  ]);
});
