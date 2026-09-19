import { Marked, type Tokens } from 'marked';

// 投影された Markdown をサニタイズして描画する。raw HTML は文字列として出し、
// リンクは http(s) とサイト内絶対パスだけ、画像は alt テキストだけにする。
const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// トークン全体が 1 つの HTML コメントのときだけ真になる (途中に --> を挟む形は除く)。
// 原稿の check-content 免除マークのような編集用コメントを読者に見せないために使う。
const htmlComment = /^\s*<!--(?:(?!-->)[\s\S])*-->\s*$/;

// rehype-slug (github-slugger) 相当: 小文字化、空白は -、記号は落とす。日本語はそのまま。
function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}_-]/gu, '');
}
function safeHref(href: string) {
  if (href.startsWith('/') && !href.startsWith('//')) return { href, external: false };
  try {
    const url = new URL(href);
    if (['https:', 'http:'].includes(url.protocol) && !url.username && !url.password) {
      return { href: url.href, external: true };
    }
  } catch {
    /* 解釈できない href はリンクにしない */
  }
  return null;
}

// 見出し id の重複は github-slugger と同じく -1 / -2 を付ける。renderMarkdown ごとに数え直す。
let headingIds = new Map<string, number>();
function uniqueId(text: string) {
  const base = slugify(text);
  const seen = headingIds.get(base) ?? 0;
  headingIds.set(base, seen + 1);
  return seen === 0 ? base : `${base}-${seen}`;
}

const marked = new Marked({
  gfm: true,
  renderer: {
    html({ text }: Tokens.HTML | Tokens.Tag) {
      // コメントだけのトークンは落とす。それ以外の raw HTML は従来どおり文字列にする。
      return htmlComment.test(text) ? '' : escapeHtml(text);
    },
    heading(
      this: { parser: { parseInline(tokens: Tokens.Generic[]): string } },
      token: Tokens.Heading,
    ) {
      const { tokens, depth } = token;
      const text = this.parser.parseInline(tokens);
      const id = uniqueId(tokens.map((item) => ('text' in item ? String(item.text) : '')).join(''));
      return `<h${depth} id="${escapeHtml(id)}">${text}<a class="heading-anchor" href="#${escapeHtml(id)}" aria-label="この見出しへのリンク">#</a></h${depth}>\n`;
    },
    link(this: { parser: { parseInline(tokens: Tokens.Generic[]): string } }, token: Tokens.Link) {
      const text = this.parser.parseInline(token.tokens);
      const safe = safeHref(token.href);
      if (!safe) return text;
      return safe.external
        ? `<a href="${escapeHtml(safe.href)}" target="_blank" rel="noopener noreferrer">${text}</a>`
        : `<a href="${escapeHtml(safe.href)}">${text}</a>`;
    },
    image({ text }: Tokens.Image) {
      return escapeHtml(text);
    },
  },
});

export function renderMarkdown(source: string): string {
  headingIds = new Map();
  return marked.parse(source, { async: false }) as string;
}
