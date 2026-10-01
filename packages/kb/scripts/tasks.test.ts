import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { type CommandSpec, pnpmCommand } from '../../../../../scripts/runtime/process.ts';
import { main } from './tasks.ts';

const kb = fileURLToPath(new URL('../', import.meta.url));
// Playwright の設定そのものの検査は node 側 (tests/playwright-config.test.mjs) が持つ。
// この道具は Deno で動くので、node の依存を読む設定ファイルを import しない。
// アプリの入口は pnpm、Deno のまま残るのは道具 (deployment-smoke.ts) だけ。
for (const [task, command, expected] of [
  ['e2e', pnpmCommand, ['run', 'e2e', '--grep', 'synthetic']],
  ['smoke', Deno.execPath(), ['run', '-A', 'scripts/deployment-smoke.ts', '--grep', 'synthetic']],
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
    assert.equal(calls.length, 1);
    assert.equal(calls[0].command, command);
    assert.deepEqual(calls[0].args, [...expected]);
    assert.equal(calls[0].cwd, kb);
  });
}

// 配布用 build は、コミット済みの公開投影だけを入力にする (fixture の混入は公開内容の誤りになる)。
Deno.test('KB release build installs at the workspace root and never inherits fixture content roots', async () => {
  const calls: CommandSpec[] = [];
  assert.equal(
    await main(['build-release'], async (spec) => {
      calls.push(spec);
      return 0;
    }),
    0,
  );
  assert.equal(calls[0].command, pnpmCommand);
  assert.deepEqual(calls[0].args, ['install', '--frozen-lockfile']);
  assert.equal(calls[0].env, undefined);
  assert.equal(calls.length, 3);
  assert.deepEqual(calls[1].args, ['exec', 'astro', 'build']);
  assert.deepEqual(calls[2].args, ['scripts/build-slides.mjs']);
  for (const call of calls.slice(1)) {
    assert.equal(call.cwd, kb);
    for (const [key, directory] of [
      ['KB_CONTENT_ROOT', 'novels'],
      ['KB_ABOUT_CONTENT_ROOT', 'about'],
      ['KB_EVENTS_CONTENT_ROOT', 'events'],
      ['KB_CFP_CONTENT_ROOT', 'cfp'],
      ['KB_BLOG_CONTENT_ROOT', 'blog'],
      ['KB_SLIDES_CONTENT_ROOT', 'slides'],
    ]) {
      assert.ok(
        call.env![key].replaceAll('\\', '/').endsWith(`/src/content/${directory}`),
        `${key}: ${call.env![key]}`,
      );
    }
  }
  // 途中で失敗したら残りは走らせない。
  let attempts = 0;
  assert.equal(
    await main(['build-release'], async () => {
      attempts += 1;
      return 19;
    }),
    19,
  );
  assert.equal(attempts, 1);
});

// 検証用 build は fixture だけを入力にする (公開データが混ざると、検証が本番の内容に依存する)。
Deno.test('KB validation build runs the tests first and uses only the six fixture roots', async () => {
  const calls: CommandSpec[] = [];
  assert.equal(
    await main(['build-validation'], async (spec) => {
      calls.push(spec);
      return 0;
    }),
    0,
  );
  assert.deepEqual(calls[0].args, ['run', 'test']);
  assert.equal(calls[0].env, undefined);
  assert.deepEqual(calls[1].args, ['exec', 'astro', 'build']);
  assert.deepEqual(calls[2].args, ['scripts/build-slides.mjs']);
  for (const call of calls.slice(1)) {
    assert.equal(call.cwd, kb);
    for (const [key, directory] of [
      ['KB_CONTENT_ROOT', 'novels'],
      ['KB_ABOUT_CONTENT_ROOT', 'about'],
      ['KB_EVENTS_CONTENT_ROOT', 'events'],
      ['KB_CFP_CONTENT_ROOT', 'cfp'],
      ['KB_BLOG_CONTENT_ROOT', 'blog'],
      ['KB_SLIDES_CONTENT_ROOT', 'slides'],
    ]) {
      assert.ok(
        call.env![key].replaceAll('\\', '/').endsWith(`/tests/fixtures/${directory}`),
        `${key}: ${call.env![key]}`,
      );
    }
  }
  // テストが落ちたら build へ進まない。
  let attempts = 0;
  assert.equal(
    await main(['build-validation'], async () => {
      attempts += 1;
      return 17;
    }),
    17,
  );
  assert.equal(attempts, 1);
});
