# Draft memo — フロントエンドカンファレンス関西2026 (Regular: FSD × Bebeu)

このファイルは `_` 始まりなので Astro Content Collection の対象外。draft 段階の試行錯誤・アイデア出し・捨てたバージョンなどを自由に書いてOK（git には残るが、サイトには公開されない）。

submit が固まったら本体（`index.md`）の `Memo` セクションに移植し、ここは作業ログとして残す or 削除。

## このプロポーザル

- 枠: **レギュラートーク（30分）**
- 題材: [Bebeu](https://github.com/sakai-nako/Bebeu) を元にした Feature-Sliced Design (FSD) の実践
- もう片方の応募: [../2026-06-16-frontend-conf-kansai-2026-slidev-video/](../2026-06-16-frontend-conf-kansai-2026-slidev-video/) (LT 枠 / Slidev 動画化)

## イベント情報メモ

- 開催日: 2026-10-12 (月・祝) 10:00–20:00
- 会場: コングレスクエア グラングリーン大阪
- 応募締切: **2026-06-30 (火) 23:59**
- 応募先: https://fortee.jp/fec-kansai-2026/speaker/proposal/cfp
- セッション枠: レギュラートーク（30分）/ LT（5分）
- 言語: 日本語登壇
- 複数応募可（レギュラー × LT の重複採択は原則不可）

## 軸・構成（決定: 2026-06-21）

幹・ペルソナ・持ち帰り価値・30 分配分の構成は **[index.md](./index.md) の Memo セクションに集約**したのでそちらを参照。本ファイルは作業ログ・素材リスト・推敲メモ。

## 素材（Bebeu / local-game-rs 内）

- リポジトリ: https://github.com/sakai-nako/Bebeu (公開) / `~/Main/repos/local-game-rs/` (private 側)
- ADR-0001: FSD 採用決定 (`local-game-rs/.claude/adr/0001-adopt-feature-sliced-design.md`)
- ADR-0003: DDD 集約ルート ⇔ FSD slice の 1:1 対応 (`.claude/adr/0003-aggregate-root-as-slice.md`) — Q&A 退避
- FSD ドキュメント本体: `.claude/docs/fsd.md`、OOUI 連携: `.claude/docs/ooui-fsd.md`
- 実装: `packages/editor-desktop/src/{app, pages, widgets, features, entities, shared}/` で 6 layer
- 全 27 ADR (`.claude/adr/`) の骨格として FSD が機能

## 構成設計の経緯（story-structure Skill で詰めた要点）

- **角度**: (n-1) Web 越境系（テーマ "Frontend, Unbounded." と整合）+ (n-2) Rust 固有翻案を山に — の組み合わせ
- **幹の拡張**: 当初は「Rust + コンパイラ」軸だったが、AI 駆動開発との相性を加えて「**3 つの守護者**」（FSD 決定木 / Rust コンパイラ / AI 駆動開発）構図に。さらに FE 文脈を入れて聴衆の入り口を作った
- **山②の発展**: 「AI に効く」だけでなく「自分自身もコード把握しやすくなる」を追加。同じ機械可読な決定木が **AI にも自分にも** 効く、という対称構造
- **越境軸の 2 段重ね**: 当初は「TS → Rust」の実装軸だけだったが、「**Web FE → ゲームエンジンエディタ**」のドメイン軸を主役に格上げ。Rust 翻案はその副次として配置。テーマ "Frontend, Unbounded." と直結が強くなった
- **TS / FSD の扱い**: 「皆さんよく知ってる」前提を外す（FSD は比較的新しい）。「TS で生まれた / 広まった」も避ける ─ **ファクトチェックの結果、FSD 公式は framework / language 非依存と明言**しており、JS/TS で採用例が多いのは「実態」であって「origin」ではない。タイトルや本文は「フロントエンド発」「FSD の世界では」と表現
- **削った素材**: ADR-0003（DDD 集約） / 他 ADR / Dioxus reactivity / Bevy 側 / 具体 AI ツール名 → すべて Q&A 退避

## アイデア出し

<!-- ここに自由に書く -->

## 過去の関連素材

- 横断原則: [../../../../docs/learnings/playbook.md](../../../../docs/learnings/playbook.md)
- CfP プレイブック: [../../../../docs/cfp/playbook.md](../../../../docs/cfp/playbook.md)
