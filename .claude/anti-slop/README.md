# anti-slop/ — AI Slop 対策フレームワーク

AI で下書きした文章を**公開前にレビューして「AI 臭」を抜く**ための観点・語彙・パターン集です。媒体ごとにバラバラに気をつけていた「人間の声で書く」という作業を、判定可能な観点に分解しました。

このディレクトリは [storytelling/](../storytelling/) と同じく 2 つの顔を持ちます。

1. **人間が読むガイド** — 公開前のセルフチェック時に観点を名指しするための参照。
2. **Skill が参照する SSOT** — 対話的レビュー Skill（[slop-review](../skills/slop-review/SKILL.md)）がここを唯一の根拠として動きます。

AI エージェント向けの起動ルールは [rules/37-anti-slop.md](../rules/37-anti-slop.md) にあります。

> 参考: [stop-ai-slop-jp](https://github.com/iKora128/stop-ai-slop-jp)（日本語、優先）、[stop-slop](https://github.com/hardikpandya/stop-slop)（英語）、[tropes.fyi](https://tropes.fyi/tropes-md)。本ディレクトリはこれらを土台に、本リポジトリ既存の文体規約（ベタ詰め等）と整合させた版です。

---

## ファイル構成（番号体系）

`.claude/rules/` および `.claude/storytelling/` と同じく **10 刻み**で、番号が小さいほど基盤的・抽象的です。

| ファイル                                       | 役割                                                       |
| :--------------------------------------------- | :--------------------------------------------------------- |
| [00-core.md](./00-core.md)                     | 定義 / 5 軸スコアリング / 修正優先順位 / 対象外メディア      |
| [01-phrases.md](./01-phrases.md)               | 撲滅すべき語彙・フレーズ（日本語中心 + 英語混入版）         |
| [02-structures.md](./02-structures.md)         | 構造パターン（否定的並列・断片化・メタコメント等）         |
| [03-tropes.md](./03-tropes.md)                 | tropes.fyi 由来のトロープ集（語彙/構造/段落/トーン/装飾/構成） |
| [10-blog.md](./10-blog.md)                     | 媒体別アダプタ: ブログ記事 + 既存スタイル規約との整合      |
| [20-slides.md](./20-slides.md)                 | 媒体別アダプタ: 発表資料（地の文・スライド本文）           |
| [90-principles.md](./90-principles.md)         | 横断原則（人間らしさ=反復ではなく癖 / 小説への非適用 等）  |

---

## 対象と非対象

### 対象

- ブログ記事 ([src/content/blog/](../../src/content/blog/))
- 外部投稿記事の下書き ([content-external/articles/](../../content-external/articles/))
- 発表資料の地の文・本文 (`_slide_structure.md` および [src/content/slides/](../../src/content/slides/) 配下の `index.md` の本文部分)
- CfP の abstract ([src/content/cfp/](../../src/content/cfp/))
- SNS 下書き ([content-external/sns/](../../content-external/sns/))

### 非対象（重要）

- **小説** ([src/content/novels/](../../src/content/novels/)) — 文体・反復・断片化・独白は意図的な作家性。AI Slop の規範を当てると破綻する。文章の磨き込みは [novel-revision Skill](../skills/novel-revision/SKILL.md) の領分
- **コードコメント / 技術 doc / frontmatter** — 機械可読性と簡潔さが優先

---

## 使い方

- **書いた直後にセルフチェックしたい** → [slop-review Skill](../skills/slop-review/SKILL.md) を起動して対話的に直す
- **書く前に何を避けるか頭に入れたい** → [00-core.md](./00-core.md) で 5 軸を、[01-phrases.md](./01-phrases.md) で撲滅語彙を一読
- **媒体ごとの勘所** → [10-blog.md](./10-blog.md) / [20-slides.md](./20-slides.md)
- **網羅的なトロープ図鑑** → [03-tropes.md](./03-tropes.md)（人間が読む辞書として）

---

## 設計思想

- **置き換えない、足す**: [storytelling/](../storytelling/) や [rules/](../rules/) の各規約を上書きせず、「書いたあとの臭み抜き」の観点だけを横断的に足す
- **判定は対話のフック**: 5 軸スコアは「立場 6/10、削減 4/10 ですね」のような会話の切り口として使う。機械判定の道具ではない
- **媒体差を尊重する**: ブログとスライドで効くチェックが、小説では逆効果になる。境界を明確に切る（[90-principles.md](./90-principles.md)）
- **既存好みと衝突しない**: ベタ詰め・ニッチ趣味の扱い・存命作曲者敬称といったユーザー固有のスタイル規約を踏襲する（[10-blog.md](./10-blog.md) 末尾の整合節）
