# storytelling/ — ストーリー構成フレームワーク

ブログ・発表資料・小説に**共通して使える「ストーリー構成」の設計フレームワーク**です。媒体ごとにバラバラだった構成の考え方を、物語論（Narratology）を土台に一本化しました。

このディレクトリは 2 つの顔を持ちます。

1. **人間が読むガイド** — 構成に迷ったときに観点を名指しするための参照。
2. **Skill / SubAgent が参照する SSOT** — 対話的構成支援 Skill（[story-structure](../skills/story-structure/SKILL.md)）と媒体別 SubAgent（[blog-architect](../agents/blog-architect.md) / [slide-architect](../agents/slide-architect.md) / [novel-architect](../agents/novel-architect.md)）が、ここを唯一の根拠として動きます。

AI エージェント向けの起動ルールは [rules/36-storytelling.md](../rules/36-storytelling.md) にあります。

---

## ファイル構成（番号体系）

`.claude/rules/` と同じく **10 刻み**で、番号が小さいほど基盤的・抽象的です。

| ファイル                             | 役割                                                       |
| :----------------------------------- | :--------------------------------------------------------- |
| [00-core.md](./00-core.md)           | 共通コア。媒体横断の構成設計の観点（不変条件 / 素材と語りの分離 / 実務観点 8 つ） |
| [01-narratology.md](./01-narratology.md) | 物語論の語彙集（語る側＝構造）。用語・日本語定訳・転用例の辞書 |
| [02-cognitive.md](./02-cognitive.md) | 認知物語論（受け取られる側＝受容）。物語性／ノーマン三モデル／欠落のデザイン |
| [10-blog.md](./10-blog.md)           | 媒体別アダプタ: ブログ記事                                 |
| [20-slides.md](./20-slides.md)       | 媒体別アダプタ: 発表資料（スライド）                       |
| [30-novel.md](./30-novel.md)         | 媒体別アダプタ: 小説                                       |
| [90-principles.md](./90-principles.md) | 横断原則。playbook から構成に効く「伸びる型」を昇華         |

---

## 使い方

- **構成を一から考えたい / レビューしてほしい**: [story-structure Skill](../skills/story-structure/SKILL.md) を起動して対話的に進める。
- **構成案のドラフト生成 / 自律レビューを投げたい**: 媒体別 SubAgent（`blog-architect` / `slide-architect` / `novel-architect`）に委任する。
- **自分で書きながら参照したい**: まず [00-core.md](./00-core.md)、用語が気になったら [01-narratology.md](./01-narratology.md)、「受け手にどう届くか」が気になったら [02-cognitive.md](./02-cognitive.md)、媒体の勘所は 10/20/30。

---

## 設計思想

- **置き換えない、足す**: 各媒体の既存ルール（[rules/35-novels.md](../rules/35-novels.md)、[novels/README.md](../../src/content/novels/README.md)、Slidev 運用）を上書きせず、構成の考え方だけを横断的に足す。記法・配置の SSOT はそれぞれの場所のまま。
- **型は道具**: 型にはめることが目的ではなく、「どの観点で迷っているか」を名指しできるようにするための語彙。
- **理論で裏打ちするが、実務で語る**: 物語論の用語を借りつつ、毎回「ブログ／スライド／小説でどう使うか」の転用例まで落とす。
