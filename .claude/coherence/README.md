# Coherence

文章の要素（段落・文・句）間の **接続度（coherence / cohesion）** を診断・改善するためのフレームワーク。

## いつ使う

- 「読んでいて『なぜここでこの話？』と詰まる箇所がある」「論理が飛躍しているように感じる」「先出しした情報が後で生きない」など、要素間の意味接続に違和感があるとき
- 構成（流れ・幹）は決まっているが、つなぎ方を磨きたいとき
- AI で下書きした文章を、語彙レベル（slop）でも構成レベル（story）でもなく、**つながりの密度**で見たいとき

## SSOT 構成

| ファイル | 内容 |
| :--- | :--- |
| [00-core.md](./00-core.md) | Cohesion / Coherence の定義、評価フォーマット（接続マップ）、修正アクション 4 種 |
| [01-connection-types.md](./01-connection-types.md) | RST 系の接続タイプ辞書（Cause-Consequence / Contrast / Setup-Payoff など） |
| [02-symptoms.md](./02-symptoms.md) | 接続度が低い症状パターン辞書（先出し未回収・メタファー論理橋省略 など） |
| [10-blog.md](./10-blog.md) | ブログ・記事・CFP abstract 向けアダプタ |
| [20-slides.md](./20-slides.md) | スライド原稿向けアダプタ |
| [90-principles.md](./90-principles.md) | 横断原則・他フレームワークとの切り分け |

## 関連 Skill / SubAgent

- [coherence-review Skill](../skills/coherence-review/SKILL.md) — 対話的レビューフロー
- SubAgent: 現状なし（公開前文章は元原稿前提のため Skill だけで成立する。必要が出たら追加）

## 他フレームワークとの切り分け

| 軸 | 何を見る | 粒度 | SSOT |
| :--- | :--- | :--- | :--- |
| story-structure | プロット・章立て・伏線・幹 | マクロ（章・節） | [storytelling/](../storytelling/) |
| **coherence**（本フレームワーク） | **要素間の接続強度と接続タイプ** | 中間（段落・文） | （ここ） |
| slop-review | 語彙・記号・構造パターン | ミクロ（語・記号） | [anti-slop/](../anti-slop/) |

迷ったらユーザーに「流れ（構成）の話か、つなぎ（接続）の話か、語り口（語彙・記号）の話か」を確認する。詳細は [90-principles.md](./90-principles.md)。

## 理論的基盤

- **Halliday & Hasan (1976)** *Cohesion in English* — cohesion（言語的結束）と coherence（意味的一貫性）の区別
- **Mann & Thompson (1988)** *Rhetorical Structure Theory: Toward a functional theory of text organization* — 文章要素間の接続関係の類型化
- **Sanders, Spooren & Noordman (1992)** *Toward a taxonomy of coherence relations* — 接続関係の認知的次元（基本操作・極性・原因の方向 等）

実務的に使う語彙は [01-connection-types.md](./01-connection-types.md) に集約。学術用語の披露で終わらせず、必ず実例とセットで運用する（[rules/17-writing-style.md](../rules/17-writing-style.md) §6.1 と整合）。
