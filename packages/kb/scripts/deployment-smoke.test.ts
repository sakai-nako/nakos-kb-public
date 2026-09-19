import assert from 'node:assert/strict';
import { main, probe } from './deployment-smoke.ts';

Deno.test('KB smoke requests only HEAD at the origin and accepts 200 HTML', async () => {
  let calls = 0;
  await probe('https://kb.example.invalid/nested', (input, init) => {
    calls++;
    assert.equal(String(input), 'https://kb.example.invalid/');
    assert.equal(init?.method, 'HEAD');
    assert.equal(init?.redirect, 'manual');
    assert.ok(init?.signal instanceof AbortSignal);
    return Promise.resolve(
      new Response(null, { headers: { 'content-type': 'text/html; charset=utf-8' } }),
    );
  });
  assert.equal(calls, 1);
});

for (const [status, type] of [
  [503, 'text/html'],
  [301, 'text/html'],
  [200, 'application/json'],
  [200, ''],
] as const) {
  Deno.test(`KB smoke rejects HTTP ${status} with ${type || 'no content type'}`, async () => {
    await assert.rejects(
      () =>
        probe('https://kb.example.invalid', () =>
          Promise.resolve(new Response(null, { status, headers: { 'content-type': type } })),
        ),
      /KB health failed/,
    );
  });
}

Deno.test('KB smoke propagates a request timeout', async () => {
  const timeout = new DOMException('synthetic timeout', 'TimeoutError');
  await assert.rejects(
    () => probe('https://kb.example.invalid', () => Promise.reject(timeout)),
    (error) => error === timeout,
  );
});

Deno.test('KB smoke CLI requires one explicit URL before requesting', async () => {
  let calls = 0;
  const request = () => {
    calls++;
    return Promise.resolve(new Response());
  };
  await assert.rejects(() => main([], request), /usage/);
  await assert.rejects(() => main(['https://kb.example.invalid', 'extra'], request), /usage/);
  assert.equal(calls, 0);
});
