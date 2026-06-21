#!/usr/bin/env node
/**
 * Slidev スライドビルドスクリプト
 *
 * src/content/slides/ 内の全スライドをビルドし、
 * public/slides/{slug}/ に出力する
 */

import { execSync } from 'node:child_process';
import { appendFileSync, cpSync, existsSync, readFileSync, readdirSync, unlinkSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ensureDeckAssets } from './lib/setup-slide-decks.mjs';

// 各デッキディレクトリ内に置かれる Slidev 管理ファイル/ディレクトリ。
// dist/slides/<slug>/ への追加コピー対象から除外する。
const SLIDEV_RESERVED = new Set([
  'index.md',
  'components',
  'slide-images',
  'global-bottom.vue',
  'global-top.vue',
  'vite.config.ts',
  'style.css',
  'setup',
  'pages',
  'layouts',
  'snippets',
]);

// プロジェクトルートを取得（scripts/ の親ディレクトリ）
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

const SLIDES_DIR = join(PROJECT_ROOT, 'src/content/slides');
const SHARED_DIR = join(SLIDES_DIR, '_shared');
// Astroビルド後にdist/slides/へ直接出力（publicを経由しない）
const OUTPUT_BASE = join(PROJECT_ROOT, 'dist/slides');

/**
 * frontmatter から `draft:` フラグを抜き出す。完全なパーサーは入れず、`draft: true` の有無だけ判定する。
 * @param {string} filePath
 * @returns {boolean}
 */
function isDraftDeck(filePath) {
  const text = readFileSync(filePath, 'utf8');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return false;
  return /^\s*draft:\s*true\s*$/m.test(match[1]);
}

/**
 * スライドファイル一覧を取得
 * 各デッキは <slug>/index.md として配置される。
 * `_` 始まりのディレクトリ（例: _shared）と draft: true なデッキは除外する。
 * @returns {string[]} スライドファイルのパス配列
 */
function getSlideFiles() {
  return readdirSync(SLIDES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
    .map((d) => join(SLIDES_DIR, d.name, 'index.md'))
    .filter(existsSync)
    .filter((path) => {
      if (isDraftDeck(path)) {
        console.log(`⏭️  Skipping draft deck: ${basename(dirname(path))}`);
        return false;
      }
      return true;
    });
}

/**
 * <slug>/index.md のパスから slug（親ディレクトリ名）を取り出す。
 * @param {string} filePath
 * @returns {string}
 */
function getSlug(filePath) {
  return basename(dirname(filePath));
}

/**
 * 単一スライドをビルド
 * @param {string} filePath
 */
function buildSlide(filePath) {
  const slug = getSlug(filePath);
  const outDir = join(OUTPUT_BASE, slug);
  const baseUrl = `/slides/${slug}/`;

  console.log(`📊 Building: ${filePath} -> ${outDir}`);

  ensureDeckAssets(dirname(filePath), SHARED_DIR);

  try {
    execSync(`npx slidev build "${filePath}" --base "${baseUrl}" --out "${outDir}"`, {
      stdio: 'inherit',
    });
    console.log(`✅ Built: ${slug}`);

    // デッキディレクトリ内のユーザー追加アセット（PDF や補足画像など）を出力先にコピーする。
    // `_` 始まり（_notes.md など発表メモ）と Slidev 管理ファイル/ディレクトリは除外。
    const assetsDir = dirname(filePath);
    console.log(`📁 Copying user assets from: ${assetsDir}`);
    cpSync(assetsDir, outDir, {
      recursive: true,
      filter: (src) => {
        if (src === assetsDir) return true;
        const name = basename(src);
        if (name.startsWith('_')) return false;
        if (dirname(src) === assetsDir && SLIDEV_RESERVED.has(name)) return false;
        return true;
      },
    });
  } catch (error) {
    console.error(`❌ Failed to build: ${slug}`);
    throw error;
  }
}

/**
 * 共有画像ディレクトリのコピー
 * src/content/slides/_shared/slide-images/ -> dist/slide-images/
 */
function copySlideImages() {
  const srcDir = join(SLIDES_DIR, '_shared/slide-images');
  const destDir = join(PROJECT_ROOT, 'dist/slide-images');

  if (existsSync(srcDir)) {
    console.log(`🖼️  Copying slide_images: ${srcDir} -> ${destDir}`);
    cpSync(srcDir, destDir, { recursive: true });
    console.log(`✅ slide_images copied\n`);
  }
}

/**
 * 各スライドの_redirectsをルートにマージ
 * Cloudflare Pagesはルートの_redirectsのみ認識するため
 */
function mergeRedirects() {
  const rootRedirects = join(PROJECT_ROOT, 'dist/_redirects');
  const slidesDirs = readdirSync(OUTPUT_BASE, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  console.log('📝 Merging _redirects files...');

  for (const slug of slidesDirs) {
    const slideRedirects = join(OUTPUT_BASE, slug, '_redirects');
    if (existsSync(slideRedirects)) {
      // Slidevが生成する _redirects は assets も含めてすべてを index.html にリダイレクトするため、
      // 静的ファイル（assets/）を除外するルールを追加する
      // Cloudflare Pages の _redirects はルールの順序が重要で、先に記述したルールが優先される
      const basePath = `/slides/${slug}`;
      const spaRouting = `
# Slidev SPA routing for ${slug}
# 静的アセットはそのまま配信（リダイレクトしない）
${basePath}/assets/*  ${basePath}/assets/:splat  200
# それ以外のパスはSPAとしてindex.htmlにルーティング
${basePath}/*  ${basePath}/index.html  200
`;
      appendFileSync(rootRedirects, spaRouting);
      unlinkSync(slideRedirects); // 元ファイルを削除
      console.log(`  ✅ Merged: ${slug}/_redirects`);
    }
  }
}

/**
 * メイン処理
 */
function main() {
  console.log('🚀 Starting Slidev build process...\n');

  // 共有画像ディレクトリをコピー
  copySlideImages();

  const slideFiles = getSlideFiles();

  if (slideFiles.length === 0) {
    console.log('⚠️  No slide files found in', SLIDES_DIR);
    return;
  }

  console.log(`Found ${slideFiles.length} slide(s):\n`);

  for (const file of slideFiles) {
    buildSlide(file);
    console.log('');
  }

  // _redirectsをルートにマージ
  mergeRedirects();

  console.log('\n🎉 All slides built successfully!');
}

main();
