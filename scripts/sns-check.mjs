#!/usr/bin/env node
/**
 * sns-check.mjs — X 投稿（生標）の放流状況チェックと今日のセクション準備
 *
 * content-external/sns/x/content/*.md の #生標_YYYY_MM_DD タグから
 * 「どの日まで放流済みか」を割り出し、未放流の日数を報告する。
 * （見出し日付ではなくタグを見るのは、まとめ放流で複数日分を 1 ポストに
 * 積む運用のため。カバー済みの日はタグが真実を持つ）
 *
 * Usage:
 *   node scripts/sns-check.mjs             # 放流状況を表示
 *   node scripts/sns-check.mjs --hook      # 未放流があるときだけ JSON を出力（SessionStart フック用）
 *   node scripts/sns-check.mjs --scaffold  # 今日のセクションを <year>.md に用意して状況を表示
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'content-external', 'sns', 'x', 'content');

const mode = process.argv[2] ?? '';

const pad = (n) => String(n).padStart(2, '0');
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = new Date();
const todayStr = fmt(today);

// 年跨ぎでも最終放流日を見失わないよう、アーカイブ全ファイルからタグを収集する。
// ただし本文が空の ```text ブロック（scaffold 直後など）のタグは未放流扱い —
// でないと空の雛形を作った時点でリマインダーが黙ってしまう。
const covered = [];
if (existsSync(contentDir)) {
  for (const file of readdirSync(contentDir).filter((f) => f.endsWith('.md'))) {
    const text = readFileSync(path.join(contentDir, file), 'utf8');
    for (const block of text.matchAll(/```text\n([\s\S]*?)```/g)) {
      const lines = block[1].split('\n').map((l) => l.trim());
      const hasBody = lines.some((l) => l && !l.startsWith('#'));
      if (!hasBody) continue;
      for (const m of block[1].matchAll(/#生標_(\d{4})_(\d{2})_(\d{2})/g)) {
        covered.push(`${m[1]}-${m[2]}-${m[3]}`);
      }
    }
  }
}

if (covered.length === 0) {
  if (mode !== '--hook') console.error(`生標タグが見つかりません: ${contentDir}`);
  process.exit(mode === '--hook' ? 0 : 1);
}

const last = covered.sort().at(-1);

// last の翌日から今日までが未放流（今日の分も含む）
const pending = [];
{
  const [y, mo, d] = last.split('-').map(Number);
  const cursor = new Date(y, mo - 1, d + 1);
  while (fmt(cursor) <= todayStr) {
    pending.push(fmt(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
}

const statusLine =
  pending.length === 0
    ? `✅ 生標は今日の分まで放流済み（最終: ${last}）`
    : pending.length === 1
      ? `⏰ 今日の生標（${todayStr}）がまだです（最終放流: ${last}）`
      : `⏰ 生標が${pending.length}日分未放流（${pending[0]}〜${pending.at(-1)}、最終放流: ${last}）`;

if (mode === '--hook') {
  // SessionStart フック用: 未放流があるときだけ知らせる（放流済みなら無言）
  if (pending.length > 0) {
    const context =
      `${statusLine}。\`just sns\` で今日のセクションを ` +
      `content-external/sns/x/content/${today.getFullYear()}.md に用意できます。`;
    console.log(
      JSON.stringify({
        systemMessage: statusLine,
        hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: context },
      }),
    );
  }
  process.exit(0);
}

console.log(statusLine);

if (mode === '--scaffold') {
  const target = path.join(contentDir, `${today.getFullYear()}.md`);
  let text = existsSync(target) ? readFileSync(target, 'utf8') : `# X ${today.getFullYear()}\n\n`;

  if (text.includes(`## ${todayStr}`)) {
    console.log(`✍️ 今日のセクションは既にあります: ${path.relative(root, target)}`);
    process.exit(0);
  }

  // 1日ごとに画像を添付する運用で、X は 1 ポスト画像 4 枚まで。
  // なので 1 ポスト（```text ブロック）あたり最大 4 日分に分割する。
  const DAYS_PER_POST = 4;
  const blocks = [];
  for (let i = 0; i < pending.length; i += DAYS_PER_POST) {
    const tags = [
      ...pending.slice(i, i + DAYS_PER_POST).map((d) => `#生標_${d.replaceAll('-', '_')}`),
      '#70歳までのカウントダウン',
    ];
    blocks.push(`\`\`\`text\n\n\n${tags.join('\n')}\n\`\`\``);
  }
  const section = `## ${todayStr}\n\n${blocks.join('\n\n')}\n\n`;

  // アーカイブは新しい日付が上。先頭の ## 見出しの直前に差し込む
  const firstHeading = text.search(/^## /m);
  text =
    firstHeading === -1
      ? text + section
      : text.slice(0, firstHeading) + section + text.slice(firstHeading);

  writeFileSync(target, text);
  console.log(`✍️ 今日のセクションを用意しました: ${path.relative(root, target)}`);
  if (blocks.length > 1) {
    console.log(
      `💡 ${pending.length}日分を${blocks.length}ポストに分割しました（画像4枚/ポスト上限）。`,
    );
  }
}
