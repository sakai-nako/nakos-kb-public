import assert from 'node:assert/strict';
import test from 'node:test';
import { renderMarkdown } from '../src/shared/markdown.ts';

test('escapes raw html and keeps it as text', () => {
  const html = renderMarkdown('段落 <script>alert(1)</script>\n\n<div>block</div>\n');
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(html.includes('&lt;div&gt;block&lt;/div&gt;'));
  assert.ok(!html.includes('<script'));
});

test('drops html comments but keeps other raw html as text', () => {
  const inline = renderMarkdown('段落 <!-- check-content: ignore (理由) --> の続き\n');
  assert.ok(!inline.includes('check-content'));
  assert.ok(inline.includes('段落') && inline.includes('の続き'));
  const block = renderMarkdown('<!-- 複数行の\nコメント -->\n\n<div>block</div>\n');
  assert.ok(!block.includes('コメント'));
  assert.ok(block.includes('&lt;div&gt;block&lt;/div&gt;'));
  // 前後にコメント以外を含む raw HTML は従来どおり文字列にする。
  const mixed = renderMarkdown('<span><!-- x --></span>\n');
  assert.ok(mixed.includes('&lt;span&gt;'));
});

test('links: http(s) only, external get noopener; others become text', () => {
  const html = renderMarkdown('[a](https://example.com/x) [b](javascript:alert(1)) [c](/local)');
  assert.ok(
    html.includes(
      '<a href="https://example.com/x" target="_blank" rel="noopener noreferrer">a</a>',
    ),
  );
  assert.ok(!html.includes('javascript:'));
  assert.ok(html.includes('b') && html.includes('c'));
  assert.ok(html.includes('<a href="/local">c</a>'));
});

test('headings become links to their own section; images become alt text', () => {
  const html = renderMarkdown(
    '## トーク概要（1000文字以内）\n\n![図](https://example.com/i.png)\n',
  );
  assert.ok(html.includes('<h2 id="トーク概要1000文字以内">'));
  assert.ok(
    html.includes(
      '<a class="heading-link" href="#トーク概要1000文字以内">トーク概要（1000文字以内）</a>',
    ),
  );
  assert.ok(!html.includes('#</a>'));
  assert.ok(!html.includes('<img'));
  assert.ok(html.includes('図'));
});

test('a heading that already contains a link is not wrapped again', () => {
  const html = renderMarkdown('## [公式サイト](https://example.com/) の案内\n');
  assert.ok(html.includes('<h2 id="公式サイト-の案内">'));
  assert.ok(!html.includes('heading-link'));
  assert.ok(
    html.includes('<a href="https://example.com/" target="_blank" rel="noopener noreferrer">'),
  );
});

test('renders lists, blockquotes, and code fences', () => {
  const html = renderMarkdown('- a\n- b\n\n> q\n\n```\n<x>\n```\n');
  assert.ok(html.includes('<ul>') && html.includes('<blockquote>'));
  assert.ok(html.includes('<pre><code>&lt;x&gt;'));
});

test('repeated headings get suffixed ids per render', () => {
  const html = renderMarkdown('## 概要\n\n## 概要\n');
  assert.ok(html.includes('<h2 id="概要">') && html.includes('<h2 id="概要-1">'));
  assert.ok(renderMarkdown('## 概要\n').includes('<h2 id="概要">'));
});
