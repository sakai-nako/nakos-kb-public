/**
 * 小説の共通記法（src/content/novels/README.md 参照）を HTML に変換する。
 *
 * 対応記法:
 * - ルビ `|漢字《かんじ》` → <ruby>漢字<rt>かんじ</rt></ruby>
 * - 傍点 `《《文字》》` → 圏点付き <em>（CSS の text-emphasis で表示）
 * - 単独行 `---` → 場面転換の <hr>
 * - 空行区切り → 段落 <p>
 * - URL → リンク（章末の楽曲情報ブロック用）
 *
 * Markdown レンダラーを通さないのは意図的: 共通記法はなろう・カクヨム互換の
 * 独自記法であり、Markdown として解釈すると `|` や字下げの全角スペースが壊れる。
 */

const escapeHtml = (text: string): string =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const renderInline = (line: string): string => {
  let html = escapeHtml(line);

  // 傍点はルビより先に処理する（どちらも《》を使うため）
  html = html.replace(/《《([^《》]+)》》/g, '<em class="emphasis-dots">$1</em>');

  // ルビ（全角｜は表記揺れだが、表示が壊れないよう許容してレンダリングする）
  html = html.replace(/[|｜]([^|｜《》]+)《([^《》]+)》/g, '<ruby>$1<rt>$2</rt></ruby>');

  html = html.replace(
    /https?:\/\/[^\s&<]+/g,
    (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`,
  );

  return html;
};

export const renderNovelBody = (body: string): string => {
  const blocks = body
    .replaceAll('\r\n', '\n')
    .trim()
    .split(/\n{2,}/);

  return blocks
    .map((block) => {
      if (block.trim() === '---') return '<hr class="scene-break" />';
      const lines = block.split('\n').map(renderInline).join('<br />');
      return `<p>${lines}</p>`;
    })
    .join('\n');
};
