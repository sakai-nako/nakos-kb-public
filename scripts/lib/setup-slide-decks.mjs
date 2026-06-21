import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, readdirSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';

// 各デッキディレクトリに展開する _shared/ 配下のディレクトリ（junction/symlink で繋ぐ）。
export const PER_DECK_LINKS = ['components', 'slide-images'];
// 各デッキディレクトリに展開する _shared/ 配下のファイル（コピーで配置）。
export const PER_DECK_COPIES = ['global-bottom.vue', 'vite.config.ts'];

/**
 * Windows ではディレクトリ junction、それ以外では symlink を作成する。
 * @param {string} link - 作成するリンクのパス
 * @param {string} target - リンク先のパス
 */
export function createDirLink(link, target) {
  if (process.platform === 'win32') {
    // execFile を使ってシェル経由のメタ文字解釈を避ける。引数は cmd に直接渡される。
    execFileSync('cmd', ['/c', 'mklink', '/J', link, target], { stdio: 'pipe' });
  } else {
    symlinkSync(target, link, 'dir');
  }
}

/**
 * 指定したデッキディレクトリ内に _shared/ 配下への junction とコピーを冪等に展開する。
 * @param {string} deckDir
 * @param {string} sharedDir
 */
export function ensureDeckAssets(deckDir, sharedDir) {
  for (const name of PER_DECK_LINKS) {
    const link = join(deckDir, name);
    if (!existsSync(link)) {
      createDirLink(link, join(sharedDir, name));
    }
  }
  for (const name of PER_DECK_COPIES) {
    cpSync(join(sharedDir, name), join(deckDir, name));
  }
}

/**
 * <slidesDir> 配下の `_shared` 以外のディレクトリで `index.md` を持つものを「デッキ」と見なし、
 * 全デッキへ ensureDeckAssets を適用する。
 * @param {string} slidesDir
 * @param {string} sharedDir
 */
export function setupAllDecks(slidesDir, sharedDir) {
  const decks = readdirSync(slidesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== '_shared')
    .map((d) => join(slidesDir, d.name))
    .filter((d) => existsSync(join(d, 'index.md')));

  for (const deck of decks) {
    console.log(`Setting up deck: ${deck}`);
    ensureDeckAssets(deck, sharedDir);
  }
}
