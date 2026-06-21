#!/usr/bin/env node
/**
 * src/content/blog/<slug>.md を Zenn 記事形式に変換して stdout へ出力する。
 *
 * Zenn frontmatter:
 *   title    : SSoT の title をそのまま
 *   emoji    : SSoT の platforms.zenn.emoji があれば使い、なければ DEFAULT_EMOJI
 *   type     : SSoT の platforms.zenn.type があれば使い、なければ DEFAULT_TYPE
 *   topics   : SSoT の tags をそのまま（最大 5 つに切り詰める）
 *   published: SSoT の draft を反転（draft: false → published: true）
 *
 * 本文の冒頭に canonical URL の注記（> 初出: https://hack-pleasantness.com/blog/<slug>）を挿入する。
 *
 * Usage:
 *   node scripts/blog-to-zenn.mjs <slug>
 *   node scripts/blog-to-zenn.mjs <slug> | clip          # Windows
 *   node scripts/blog-to-zenn.mjs <slug> | pbcopy        # macOS
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { stderr, stdout } from 'node:process';
import { fileURLToPath } from 'node:url';

import matter from 'gray-matter';

const DEFAULT_EMOJI = '📝';
const DEFAULT_TYPE = 'tech';
const CANONICAL_BASE = 'https://hack-pleasantness.com/blog';
const MAX_TOPICS = 5; // Zenn の topics は最大 5 個

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const BLOG_BASE = join(PROJECT_ROOT, 'src/content/blog');

const slug = process.argv[2];
if (!slug) {
  stderr.write('Usage: node scripts/blog-to-zenn.mjs <slug>\n');
  process.exit(1);
}

const filePath = join(BLOG_BASE, `${slug}.md`);
if (!existsSync(filePath)) {
  stderr.write(`Error: blog entry not found: ${filePath}\n`);
  process.exit(1);
}

const raw = readFileSync(filePath, 'utf8');
const { data, content } = matter(raw);

const emoji = data.platforms?.zenn?.emoji ?? DEFAULT_EMOJI;
const type = data.platforms?.zenn?.type ?? DEFAULT_TYPE;
const topics = (data.tags ?? []).slice(0, MAX_TOPICS);
const published = !data.draft;

// Zenn frontmatter を YAML として書き出す（手書き。シンプルなのでライブラリ不要）
const yamlLines = [
  '---',
  `title: ${JSON.stringify(data.title)}`,
  `emoji: ${JSON.stringify(emoji)}`,
  `type: ${JSON.stringify(type)}`,
  `topics: ${JSON.stringify(topics)}`,
  `published: ${published}`,
  '---',
];

const canonicalUrl = `${CANONICAL_BASE}/${slug}/`;
const canonicalNote = `> 初出: ${canonicalUrl}`;

const output = `${yamlLines.join('\n')}\n\n${canonicalNote}\n\n${content.trimStart()}`;

stdout.write(output);

stderr.write('\n');
stderr.write(`─── converted: ${slug} → Zenn ───\n`);
stderr.write(`  title:     ${data.title}\n`);
stderr.write(`  emoji:     ${emoji}${data.platforms?.zenn?.emoji ? '' : ' (default)'}\n`);
stderr.write(`  type:      ${type}${data.platforms?.zenn?.type ? '' : ' (default)'}\n`);
stderr.write(`  topics:    ${topics.join(', ')}\n`);
stderr.write(`  published: ${published}\n`);
stderr.write(`  canonical: ${canonicalUrl}\n`);
