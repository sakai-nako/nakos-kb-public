# Storytelling

ブログ・発表資料・小説の **ストーリー構成** に関する AI エージェント向けの振る舞い指針です。本ファイルは薄いポインタで、構成設計の考え方の **Single Source of Truth は [../storytelling/](../storytelling/)**（[novel-revision Skill](../skills/novel-revision/SKILL.md) における [novels/README.md](../../src/content/novels/README.md) と同じ関係）。

## 1. SSOT の場所

- 構成設計の観点・物語論の語彙は [../storytelling/README.md](../storytelling/README.md) を入口に参照する。
- 共通コア [00-core.md](../storytelling/00-core.md)、物語論辞書（語る側＝構造）[01-narratology.md](../storytelling/01-narratology.md)、認知物語論（受け取られる側＝受容）[02-cognitive.md](../storytelling/02-cognitive.md)、媒体別アダプタ（[10-blog](../storytelling/10-blog.md) / [20-slides](../storytelling/20-slides.md) / [30-novel](../storytelling/30-novel.md)）。
- このルールに構成論の中身を書かない。増やすべき内容は `storytelling/` 側へ。

## 2. いつ何を起動するか

| ユーザーの合図 | 起動するもの |
| :------------- | :----------- |
| 「構成を考えたい」「アウトライン作りたい」「流れを整理したい」「この記事/スライド/話を構成レビューして」 | [story-structure Skill](../skills/story-structure/SKILL.md)（対話的・段階的に進める） |
| 構成案のゼロからのドラフト生成、または原稿一式の自律レビューを丸ごと任せたい | 媒体別 SubAgent: [blog-architect](../agents/blog-architect.md) / [slide-architect](../agents/slide-architect.md) / [novel-architect](../agents/novel-architect.md) |

- **Skill と SubAgent の住み分け**: Skill はメインスレッドで一緒に考える（論点を小出しにする）。SubAgent は別コンテキストに投げ込み、レビュー結果や構成案を**まとめて受け取る**。重い／自己完結したタスクは SubAgent へ。
- 小説の**推敲（文章レベル）**は構成論ではなく [novel-revision Skill](../skills/novel-revision/SKILL.md) の領分。構成（プロット・章立て）の相談は本フレームワーク、文章の磨き込みは novel-revision、と切り分ける。

## 3. 注意

- 各媒体の**記法・配置ルールは置き換えない**。小説の記法は [35-novels.md](./35-novels.md) と [novels/README.md](../../src/content/novels/README.md)、Slidev 運用は [10-tech-stack.md](./10-tech-stack.md) が引き続き正。本フレームワークは「構成の考え方」だけを足す。
- 物語論の用語を使うときは、必ず実務の転用例（ブログ/スライド/小説でどう使うか）まで添える。学術用語の披露で終わらせない。
