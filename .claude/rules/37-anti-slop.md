# Anti-Slop

AI で下書きした文章の **公開前レビュー（AI 臭抜き）** に関する AI エージェント向けの振る舞い指針です。本ファイルは薄いポインタで、考え方の **Single Source of Truth は [../anti-slop/](../anti-slop/)**（[36-storytelling.md](./36-storytelling.md) と同じ関係）。

## 1. SSOT の場所

- 観点・語彙・パターンは [../anti-slop/README.md](../anti-slop/README.md) を入口に参照する。
- 共通コア [00-core.md](../anti-slop/00-core.md)（5 軸 / 修正優先順位）、撲滅語彙 [01-phrases.md](../anti-slop/01-phrases.md)、構造パターン [02-structures.md](../anti-slop/02-structures.md)、トロープ図鑑 [03-tropes.md](../anti-slop/03-tropes.md)、媒体別アダプタ [10-blog](../anti-slop/10-blog.md) / [20-slides](../anti-slop/20-slides.md)、横断原則 [90-principles.md](../anti-slop/90-principles.md)。
- このルールに観点の中身を書かない。増やすべき内容は `anti-slop/` 側へ。

## 2. いつ何を起動するか

| ユーザーの合図 | 起動するもの |
| :------------- | :----------- |
| 「AI 臭抜きたい」「公開前にレビュー」「ブログ仕上げ」「校正して」「最終チェック」「Slop チェック」「もっと自分の声に」 | [slop-review Skill](../skills/slop-review/SKILL.md)（対話的・段階的に進める） |

現状、Slop レビュー用の SubAgent は用意していない（公開前文章は元原稿前提のため Skill だけで成立する。必要が出たら追加）。

## 3. 適用範囲（重要）

- **対象**: ブログ ([src/content/blog/](../../src/content/blog/))、外部記事下書き ([content-external/articles/](../../content-external/articles/))、トーク原稿 (`_slide_structure.md` 等)、スライド本文 ([src/content/slides/](../../src/content/slides/))、CfP abstract ([src/content/cfp/](../../src/content/cfp/))、SNS 下書き ([content-external/sns/](../../content-external/sns/))
- **非対象**: 小説 ([src/content/novels/](../../src/content/novels/)) — 文体は意図的な作家性。文章の磨き込みは [novel-revision Skill](../skills/novel-revision/SKILL.md) を使う。コードコメント / 技術 doc 内部 / frontmatter も非対象。

詳細は [anti-slop/00-core.md](../anti-slop/00-core.md) の「対象外メディア」節、および [anti-slop/90-principles.md](../anti-slop/90-principles.md) 原則 2。

## 4. 他フレームワークとの切り分け

- **構成（流れ・組み立て・伏線・章順）** = [story-structure Skill](../skills/story-structure/SKILL.md)（SSOT: [storytelling/](../storytelling/)）
- **接続度（要素間の意味接続）** = [coherence-review Skill](../skills/coherence-review/SKILL.md)（SSOT: [coherence/](../coherence/)）
- **文章の臭み抜き（語彙・構造・記号）** = [slop-review Skill](../skills/slop-review/SKILL.md)（SSOT: [anti-slop/](../anti-slop/)）
- **小説の文章** = [novel-revision Skill](../skills/novel-revision/SKILL.md)

迷ったらユーザーに「流れ（構成）の話か、つなぎ（接続）の話か、語り口（語彙・記号）の話か」を確認する。

## 5. 注意

- **既存スタイル規約は本フレームワークより優先**: ベタ詰め（[17-writing-style.md](./17-writing-style.md) §1）、ニッチ趣味の扱い（同 §5.1）、存命作曲者の敬称（同 §5.2）。詳細は [anti-slop/10-blog.md](../anti-slop/10-blog.md) 末尾の整合節と [anti-slop/90-principles.md](../anti-slop/90-principles.md) 原則 6。
- **5 軸スコアは対話のフック**: 機械判定ではない。ユーザーが数値を嫌がったら出さない。
