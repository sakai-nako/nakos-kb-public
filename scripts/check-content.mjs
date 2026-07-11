#!/usr/bin/env node
/**
 * check-content.mjs — コンテンツの機械的スタイル検査
 *
 * 検査する規約の SSOT: .claude/rules/17-writing-style.md（§7 に対応表）
 *   - betsume:       日本語と英数字/記号の境界の半角スペース（ベタ詰め）
 *   - no-decoration: CFP 提出本文の Markdown 装飾（構造用 ## 見出しは許可）
 *   - no-duration:   CFP 提出本文の「N分で」所要時間表記
 *   - no-edit-date:  見出しへの作業日付の混入
 *
 * 免除:
 *   - 行単位: 該当行に <!-- check-content: ignore --> を含める（引用文中の固有タイトル等）
 *   - ファイル単位: LEGACY_CFP（提出済みの実物アーカイブ。当時のスタイルのまま保存する）
 *
 * Usage: node scripts/check-content.mjs
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// 2026-06 のスタイル規約確立以前に提出済みの CFP。実物アーカイブなので免除。
const LEGACY_CFP = new Set([
  '2024-09-30-sre-kaigi-2025',
  '2025-12-31-one-stop-output',
  '2026-03-01-cnk-sre-observability',
]);

const IGNORE_MARK = 'check-content: ignore';

// 日本語文字クラス（ひらがな・カタカナ・長音・漢字・々〆）
const JP = 'ぁ-んァ-ヶー一-龯々〆';

const RULES = {
  // 例外（英語フレーズ内・行頭マーカー・ダッシュ/矢印の区切り）は
  // パターン自体が「日本語と英数字/記号の境界」だけを見るため自然に除外される。
  betsume: (line) => {
    const patterns = [new RegExp(`[${JP}] [0-9A-Za-z*"(]`), new RegExp(`[0-9A-Za-z*")] [${JP}]`)];
    return patterns.find((re) => re.test(line))?.exec(line)?.[0];
  },
  'no-duration': (line) => {
    // 「30分で共有します」型の所要時間表記。事実として正当な「N分で」は行単位 ignore で免除する。
    return /\d+\s*分で/.exec(line)?.[0];
  },
  'no-decoration': (line) => {
    if (/^## /.test(line)) return undefined; // 構造用見出し（トークタイトル / トーク概要）は許可
    const checks = [
      [/\*\*/, '強調 **'],
      [/`/, 'インラインコード `'],
      [/^\s*[-*+] /, 'リスト'],
      [/^\s*\d+\. /, '番号リスト'],
      [/^>/, '引用 >'],
      [/^#{1,6} /, '## 以外の見出し'],
    ];
    return checks.find(([re]) => re.test(line))?.[1];
  },
  'no-edit-date': (line) => {
    // 見出し中の日付（作業日付の混入）。本文中の事実日付は対象外。
    return /^#{1,6} .*20\d{2}[-/年]\s?\d{1,2}/.exec(line)?.[0];
  },
};

/** frontmatter を除いた本文行を [lineNumber, text] で列挙（コードフェンス内はスキップ） */
function* bodyLines(text) {
  const lines = text.split(/\r?\n/);
  let i = 0;
  if (lines[0] === '---') {
    i = lines.indexOf('---', 1) + 1;
    if (i === 0) i = lines.length; // 閉じない frontmatter は本文なし扱い
  }
  let inFence = false;
  for (; i < lines.length; i++) {
    if (/^(```|~~~)/.test(lines[i])) {
      inFence = !inFence;
      continue;
    }
    if (!inFence) yield [i + 1, lines[i]];
  }
}

function checkFile(relPath, ruleNames) {
  const violations = [];
  const text = readFileSync(path.join(root, relPath), 'utf8');
  for (const [lineNo, line] of bodyLines(text)) {
    if (line.includes(IGNORE_MARK)) continue;
    for (const name of ruleNames) {
      const hit = RULES[name](line);
      if (hit !== undefined) {
        violations.push({ relPath, lineNo, rule: name, hit, line: line.trim() });
      }
    }
  }
  return violations;
}

function listDirs(rel) {
  const abs = path.join(root, rel);
  if (!existsSync(abs)) return [];
  return readdirSync(abs, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

function listFiles(rel, ext) {
  const abs = path.join(root, rel);
  if (!existsSync(abs)) return [];
  return readdirSync(abs, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(ext))
    .map((e) => e.name);
}

const targets = [];

for (const slug of listDirs('src/content/cfp')) {
  if (LEGACY_CFP.has(slug)) continue;
  const dir = `src/content/cfp/${slug}`;
  if (existsSync(path.join(root, dir, 'index.md'))) {
    targets.push([`${dir}/index.md`, ['betsume', 'no-duration', 'no-decoration', 'no-edit-date']]);
  }
  if (existsSync(path.join(root, dir, 'drafts.md'))) {
    targets.push([`${dir}/drafts.md`, ['no-edit-date']]);
  }
}

for (const file of listFiles('src/content/blog', '.md')) {
  targets.push([`src/content/blog/${file}`, ['betsume', 'no-edit-date']]);
}

const all = targets.flatMap(([rel, ruleNames]) => checkFile(rel, ruleNames));

if (all.length === 0) {
  console.log(`✓ check-content: 違反なし（${targets.length} ファイル検査）`);
} else {
  for (const v of all) {
    console.error(`${v.relPath}:${v.lineNo}  [${v.rule}]  ${JSON.stringify(v.hit)}`);
    console.error(`    ${v.line.slice(0, 120)}`);
  }
  console.error(`\n✖ check-content: ${all.length} 件の違反（${targets.length} ファイル検査）`);
  console.error('  正当な例外は該当行に <!-- check-content: ignore --> を付けて免除できます。');
  console.error('  規約の詳細: .claude/rules/17-writing-style.md');
  process.exit(1);
}
