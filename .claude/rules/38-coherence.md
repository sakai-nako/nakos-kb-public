# Coherence

文章の要素（段落・文・句）間の接続度（coherence / cohesion）の診断・改善に関する AI エージェント向けの振る舞い指針です。本ファイルは薄いポインタで、考え方の **Single Source of Truth は [../coherence/](../coherence/)**（[36-storytelling.md](./36-storytelling.md) と [37-anti-slop.md](./37-anti-slop.md) と同じ関係）。

## 1. SSOT の場所

- 観点・接続タイプ辞書・症状辞書は [../coherence/README.md](../coherence/README.md) を入口に参照する。
- 共通コア [00-core.md](../coherence/00-core.md)（Cohesion vs Coherence、評価フォーマット、修正アクション）、接続タイプ辞書 [01-connection-types.md](../coherence/01-connection-types.md)、症状パターン辞書 [02-symptoms.md](../coherence/02-symptoms.md)、媒体別アダプタ [10-blog](../coherence/10-blog.md) / [20-slides](../coherence/20-slides.md)、横断原則 [90-principles.md](../coherence/90-principles.md)。
- このルールに観点の中身を書かない。増やすべき内容は `coherence/` 側へ。

## 2. いつ何を起動するか

| ユーザーの合図 | 起動するもの |
| :------------- | :----------- |
| 「接続度を見て」「coherence チェック」「つながりが弱い箇所を探して」「論理が飛躍している気がする」「先出しした情報が後で生きない」「読んでいて『なぜここで？』と詰まる」「文章の流れがぎこちない」 | [coherence-review Skill](../skills/coherence-review/SKILL.md)（対話的・段階的に進める） |

現状、coherence レビュー用の SubAgent は用意していない（公開前文章は元原稿前提のため Skill だけで成立する。必要が出たら追加）。

## 3. 適用範囲

- **対象**: ブログ ([src/content/blog/](../../src/content/blog/))、外部記事下書き ([content-external/articles/](../../content-external/articles/))、トーク原稿、スライド本文 ([src/content/slides/](../../src/content/slides/))、CfP abstract ([src/content/cfp/](../../src/content/cfp/))、SNS 下書き ([content-external/sns/](../../content-external/sns/))
- **非対象**: 小説 ([src/content/novels/](../../src/content/novels/)) — 意図的な飛躍・暗黙の接続が作家性として機能する。文章は [novel-revision Skill](../skills/novel-revision/SKILL.md)、構成は [story-structure Skill](../skills/story-structure/SKILL.md) を使う。

詳細は [coherence/90-principles.md](../coherence/90-principles.md) 原則 2。

## 4. 他フレームワークとの切り分け

- **構成（流れ・組み立て・伏線・幹）** = [story-structure Skill](../skills/story-structure/SKILL.md)（SSOT: [storytelling/](../storytelling/)）
- **接続度（要素間の意味接続）** = [coherence-review Skill](../skills/coherence-review/SKILL.md)（SSOT: [coherence/](../coherence/)）
- **文章の臭み抜き（語彙・構造・記号）** = [slop-review Skill](../skills/slop-review/SKILL.md)（SSOT: [anti-slop/](../anti-slop/)）

迷ったらユーザーに「流れ（構成）の話か、つなぎ（接続）の話か、語り口（語彙・記号）の話か」を確認する。

## 5. 注意

- **既存スタイル規約は本フレームワークより優先**: ベタ詰め、Markdown 装飾なし、所要時間を書かない、等。詳細は [coherence/90-principles.md](../coherence/90-principles.md) 原則 1。
- **接続度の評価は観察可能な要素に基づく**: 主観でなく、共有語彙・接続詞・指示語などの言語的合図で根拠を示す（原則 7）。
- **接続タイプの語彙は [01-connection-types.md](../coherence/01-connection-types.md) を使う**: RST 系の用語に揃えると一貫性が保てる。
- **修正案にはトレードオフを必ず併記**（原則 6）。
- **修正は最小単位、ワーストは 3 つ程度に絞る**（原則 8）。

## 6. 経緯メモ

このフレームワークは 2026-06-27 のフロントエンドカンファレンス関西 CFP ブラッシュアップ作業（Round 5）でユーザー提案により発足。「文章の各要素間の接続度と、なぜそう接続したのかを計測してレビュー・校正できないか」が出発点。実例（CFP 2 本）で効果を確認してから SSOT 化した。
