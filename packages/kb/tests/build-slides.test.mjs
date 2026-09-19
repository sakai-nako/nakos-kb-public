import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const kb = fileURLToPath(new URL('../', import.meta.url));
const content = path.join(kb, 'tests/fixtures/slides');

test('builds each deck into the output root and merges its redirects', () => {
  const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-slides-build-'));
  try {
    execFileSync(Deno.execPath(), ['run', '-A', 'scripts/build-slides.mjs'], {
      cwd: kb,
      env: {
        ...process.env,
        KB_SLIDES_CONTENT_ROOT: content,
        KB_SLIDES_OUT: path.join(dist, 'slides'),
      },
      stdio: 'pipe',
    });
    const deck = path.join(dist, 'slides/2026-01-01-fixture-deck');
    assert.ok(fs.readFileSync(path.join(deck, 'index.html'), 'utf8').includes('<div id="app">'));
    assert.ok(fs.readdirSync(path.join(deck, 'assets')).length > 0);
    // ユーザーが足した資産はそのまま、発表メモと Slidev の管理ファイルは出力に入らない。
    assert.equal(
      Buffer.compare(
        fs.readFileSync(path.join(deck, 'images/a.png')),
        fs.readFileSync(path.join(content, '2026-01-01-fixture-deck/images/a.png')),
      ),
      0,
    );
    for (const name of ['_notes.md', '_redirects', 'meta.json', 'components', 'vite.config.ts']) {
      assert.equal(fs.existsSync(path.join(deck, name)), false, name);
    }
    // Cloudflare は dist 直下の _redirects だけを読むので、デッキの分をここへ寄せる。
    const redirects = fs.readFileSync(path.join(dist, '_redirects'), 'utf8');
    assert.match(redirects, /^\/slides\/2026-01-01-fixture-deck\/assets\/\*/m);
    assert.match(redirects, /^\/slides\/2026-01-01-fixture-deck\/\*/m);
    assert.ok(fs.existsSync(path.join(dist, 'slide-images/nilto-qr-01.png')));
  } finally {
    fs.rmSync(dist, { recursive: true, force: true });
  }
});

// Cloudflare は _redirects を上から順に見て最初に一致した規則で決めるので、public/_redirects の
// 一般規則 (`/slides/*`) より前にデッキごとの規則を置かないと、デッキの深い path が拾われない。
test('puts the deck rules ahead of the rules copied from public/', () => {
  const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-slides-order-'));
  try {
    const target = path.join(dist, '_redirects');
    fs.writeFileSync(target, '/  /about  301\n/slides/*  /slides/:splat  200\n', 'utf8');
    execFileSync(Deno.execPath(), ['run', '-A', 'scripts/build-slides.mjs'], {
      cwd: kb,
      env: {
        ...process.env,
        KB_SLIDES_CONTENT_ROOT: content,
        KB_SLIDES_OUT: path.join(dist, 'slides'),
      },
      stdio: 'pipe',
    });
    const redirects = fs.readFileSync(target, 'utf8');
    const deckRule = redirects.indexOf('/slides/2026-01-01-fixture-deck/*');
    const catchAll = redirects.indexOf('/slides/*  /slides/:splat');
    assert.ok(deckRule >= 0 && catchAll >= 0);
    assert.ok(deckRule < catchAll, '既存の一般規則より前にデッキの規則が並ぶこと');
    assert.match(redirects, /^\/ {2}\/about {2}301$/m);
  } finally {
    fs.rmSync(dist, { recursive: true, force: true });
  }
});
