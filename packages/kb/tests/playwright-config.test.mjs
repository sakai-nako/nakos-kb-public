import assert from 'node:assert/strict';
import test from 'node:test';

import config from '../playwright.config.ts';

// E2E は自分で起こしたサーバーだけを相手にし、入力を合成データに固定する
// (コミット済みの公開投影は build-release の入力で、E2E からは触らない)。
test('E2E は合成の content root だけを持つ隔離サーバーを起こす', () => {
  const server = config.webServer;
  assert.ok(server && !Array.isArray(server));
  assert.equal(server.reuseExistingServer, false);
  assert.equal(server.env?.ASTRO_DEV_BACKGROUND, '1');
  for (const key of [
    'KB_CONTENT_ROOT',
    'KB_ABOUT_CONTENT_ROOT',
    'KB_EVENTS_CONTENT_ROOT',
    'KB_CFP_CONTENT_ROOT',
    'KB_BLOG_CONTENT_ROOT',
    'KB_SLIDES_CONTENT_ROOT',
  ]) {
    assert.ok(server.env[key].replaceAll('\\', '/').includes('/tests/fixtures/'), key);
  }
});

// サーバーは node が動かす。Deno はこのパッケージの道具 (scripts/) だけに残す。
test('E2E のサーバーは node が起こす', () => {
  const { command } = config.webServer;
  assert.match(command, /^node /);
  assert.doesNotMatch(command, /\bdeno\b/);
});
