#!/usr/bin/env node
/**
 * 小説章ファイル（共通記法）→ カクヨム形式への変換スクリプト
 *
 * 使い方:
 *   node scripts/novel-export-kakuyomu.mjs <chapter-path>
 *
 * <chapter-path> は次のいずれかの形式を受け付ける:
 *   - src/content/novels/ からの相対パス   （例: cadenza-engineering/01-not-on-the-symbols.md）
 *   - プロジェクトルートからの相対パス     （例: src/content/novels/cadenza-engineering/01-not-on-the-symbols.md）
 *   - 絶対パス
 *
 * 出力:
 *   - stdout: カクヨム形式の本文
 *   - stderr: 統計情報（行数・文字数）
 *
 * クリップボードにコピーするには OS 別コマンドにパイプ:
 *   Windows:         ... | clip
 *   macOS:           ... | pbcopy
 *   Linux (X11):     ... | xclip -selection clipboard
 *   Linux (Wayland): ... | wl-copy
 *
 * 変換ルール:
 *   - frontmatter (--- ... ---) を除去
 *   - セクション区切りの単独行 `---` を `　　　∗　　　∗　　　∗` に置換
 *   - ルビ `|漢字《かんじ》` と傍点 `《《文字》》` はそのまま（カクヨム互換）
 *   - 段落頭の全角スペース字下げもそのまま（カクヨムで正常表示）
 */

import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { argv, exit, stdout, stderr } from 'node:process';

const SECTION_SEPARATOR = '　　　∗　　　∗　　　∗';
const NOVELS_BASE = 'src/content/novels';

const [, , inputPath] = argv;

if (!inputPath) {
  stderr.write('Usage: node scripts/novel-export-kakuyomu.mjs <chapter-path>\n\n');
  stderr.write('<chapter-path> can be:\n');
  stderr.write(
    '  - relative to src/content/novels/      (e.g. cadenza-engineering/01-not-on-the-symbols.md)\n',
  );
  stderr.write(
    '  - relative to project root             (e.g. src/content/novels/cadenza-engineering/01-not-on-the-symbols.md)\n',
  );
  stderr.write('  - absolute path\n');
  exit(1);
}

const filePath = resolveChapterPath(inputPath);

let raw;
try {
  raw = readFileSync(filePath, 'utf8');
} catch (err) {
  stderr.write(`Error: failed to read "${filePath}": ${err.message}\n`);
  exit(1);
}

/**
 * 入力パスを実ファイル位置に解決する。
 * - 絶対パス・既に存在する相対パス → そのまま使用
 * - 上記で見つからない場合は src/content/novels/ 配下として再解決
 */
function resolveChapterPath(input) {
  if (isAbsolute(input) || existsSync(input)) return input;
  const prefixed = join(NOVELS_BASE, input);
  if (existsSync(prefixed)) return prefixed;
  return input; // 見つからなければ後段の readFileSync でエラーにする
}

// 1. 先頭の frontmatter を除去（--- から次の --- まで）
const withoutFrontmatter = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');

// 2. セクション区切りの単独行 --- を置換記号に
const converted = withoutFrontmatter.replace(/^---$/gm, SECTION_SEPARATOR);

// 3. 末尾の連続空行を 1 つの改行に整える
const finalOutput = converted.replace(/\n+$/, '\n');

// 4. 本文を stdout へ
stdout.write(finalOutput);

// 5. 統計を stderr へ（パイプ先には流れない）
const lines = finalOutput.split('\n').length;

// カクヨム等で参照される「本文文字数」= ルビ読み仮名・傍点記号・空白を除いた実文字数
const bodyChars = finalOutput
  .replace(/\|([^《]+)《[^》]+》/g, '$1') // ルビ記法 → 親文字のみ
  .replace(/《《([^》]+)》》/g, '$1') // 傍点記法 → 文字のみ
  .replace(/\s/g, '').length;

stderr.write('\n');
stderr.write(`─── exported: ${filePath} ───\n`);
stderr.write(`  lines:       ${lines}\n`);
stderr.write(`  total chars: ${finalOutput.length}\n`);
stderr.write(`  body chars:  ${bodyChars}  (ルビ読み・傍点・空白を除く)\n`);
