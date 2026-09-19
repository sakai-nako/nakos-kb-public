import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CommandSpec } from '../../../../../scripts/runtime/process.ts';
import config from '../playwright.config.ts';
import { main } from './tasks.ts';

const kb = fileURLToPath(new URL('../', import.meta.url));
Deno.test('KB E2E starts an isolated server with only synthetic content roots', () => {
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
    assert.ok(server.env![key].replaceAll('\\', '/').includes('/tests/fixtures/'));
  }
});
for (const [task, expected] of [
  ['e2e', ['task', 'e2e', '--grep', 'synthetic']],
  ['smoke', ['run', '-A', 'scripts/deployment-smoke.ts', '--grep', 'synthetic']],
  ['ship', ['run', '-A', resolve(kb, '../../../../scripts/ship.ts'), 'kb', '--grep', 'synthetic']],
] as const) {
  Deno.test(`KB ${task} forwards arguments and the child exit code from its package root`, async () => {
    const calls: CommandSpec[] = [];
    assert.equal(
      await main([task, '--grep', 'synthetic'], async (spec) => {
        calls.push(spec);
        return 17;
      }),
      17,
    );
    assert.deepEqual(calls, [{ command: Deno.execPath(), args: [...expected], cwd: kb }]);
  });
}
