// 投影済みのデッキ (src/content/slides/<slug>/) を Slidev でビルドし、Astro の dist に並置する。
// 共有部品は brands/personal/packages/kb/slides/_shared/ が唯一の置き場で、各デッキへの配布物は Git 除外。
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const kb = fileURLToPath(new URL('../', import.meta.url));
const contentRoot = path.resolve(
  process.env.KB_SLIDES_CONTENT_ROOT ?? path.join(kb, 'src/content/slides'),
);
const outRoot = path.resolve(process.env.KB_SLIDES_OUT ?? path.join(kb, 'dist/slides'));
const distRoot = path.dirname(outRoot);
const sharedDir = path.join(kb, 'slides/_shared');
const slidev = path.join(kb, 'node_modules/@slidev/cli/bin/slidev.mjs');

// 各デッキへ配る共有部品。ディレクトリは junction / symlink、ファイルはコピーで置く。
const LINKS = ['components', 'slide-images'];
const COPIES = ['global-bottom.vue', 'vite.config.ts'];
// デッキ直下の Slidev 管理ファイルと投影の meta.json。出力への追加コピーから外す。
const RESERVED = new Set([
  'index.md',
  'meta.json',
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

function createDirLink(link, target) {
  // シェル経由のメタ文字解釈を避けるため execFile で cmd に直接渡す。
  if (process.platform === 'win32') execFileSync('cmd', ['/c', 'mklink', '/J', link, target]);
  else fs.symlinkSync(target, link, 'dir');
}
function ensureDeckAssets(deckDir) {
  for (const name of LINKS) {
    const link = path.join(deckDir, name);
    if (!fs.existsSync(link)) createDirLink(link, path.join(sharedDir, name));
  }
  for (const name of COPIES) fs.cpSync(path.join(sharedDir, name), path.join(deckDir, name));
}
function decks() {
  if (!fs.existsSync(contentRoot)) return [];
  return fs
    .readdirSync(contentRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => entry.name)
    .filter((slug) =>
      ['index.md', 'meta.json'].every((name) => fs.existsSync(path.join(contentRoot, slug, name))),
    )
    .sort();
}
function buildDeck(slug) {
  const deckDir = path.join(contentRoot, slug);
  const outDir = path.join(outRoot, slug);
  ensureDeckAssets(deckDir);
  execFileSync(
    Deno.execPath(),
    [
      'run',
      '-A',
      slidev,
      'build',
      path.join(deckDir, 'index.md'),
      '--base',
      `/slides/${slug}/`,
      '--out',
      outDir,
    ],
    { cwd: kb, stdio: 'inherit' },
  );
  // 発表メモ (`_` 始まり) と Slidev 管理ファイルを除いたユーザー資産を出力へ足す。
  fs.cpSync(deckDir, outDir, {
    recursive: true,
    filter: (source) => {
      if (source === deckDir) return true;
      const name = path.basename(source);
      if (name.startsWith('_')) return false;
      return !(path.dirname(source) === deckDir && RESERVED.has(name));
    },
  });
}
// Cloudflare Pages は dist 直下の _redirects だけを読み、上から順に最初に一致した規則を使う。
// デッキごとの規則をここへ寄せ、静的アセットを先に除外してから残りを index.html へ流す。
// public/_redirects 由来の一般規則 (`/slides/*`) より前に置かないと、デッキの深い path が
// 一般規則に拾われて index.html へ届かない。
function mergeRedirects(slugs) {
  const rules = slugs
    .map((slug) => {
      const deckRedirects = path.join(outRoot, slug, '_redirects');
      if (fs.existsSync(deckRedirects)) fs.rmSync(deckRedirects);
      const base = `/slides/${slug}`;
      return `# Slidev SPA routing for ${slug}\n${base}/assets/*  ${base}/assets/:splat  200\n${base}/*  ${base}/index.html  200\n`;
    })
    .join('\n');
  const target = path.join(distRoot, '_redirects');
  const existing = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
  fs.writeFileSync(target, existing ? `${rules}\n${existing}` : rules, 'utf8');
}

const slugs = decks();
if (!slugs.length) {
  console.log(`No projected decks in ${contentRoot}`);
} else {
  fs.mkdirSync(distRoot, { recursive: true });
  for (const slug of slugs) buildDeck(slug);
  fs.cpSync(path.join(sharedDir, 'slide-images'), path.join(distRoot, 'slide-images'), {
    recursive: true,
  });
  mergeRedirects(slugs);
  console.log(`Built ${slugs.length} deck(s) into ${outRoot}`);
}
