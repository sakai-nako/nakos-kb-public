# Draft memo — フロントエンドカンファレンス関西2026 (LT: Slidev 動画化)

このファイルは `_` 始まりなので Astro Content Collection の対象外。draft 段階の試行錯誤・アイデア出し・捨てたバージョンなどを自由に書いてOK（git には残るが、サイトには公開されない）。

submit が固まったら本体（`index.md`）の `Memo` セクションに移植し、ここは作業ログとして残す or 削除。

## このプロポーザル

- 枠: **LT（5分）**
- 題材: このリポジトリ（nakos-kb）で Slidev のスライドをリハーサル動画化できるようにした話
  - 構成: VOICEVOX + Slidev + ffmpeg
  - エントリポイント: `just sim-video <deck>` ([scripts/build-sim-video.mjs](../../../../scripts/build-sim-video.mjs))
- もう片方の応募: [../2026-06-16-frontend-conf-kansai-2026-fsd/](../2026-06-16-frontend-conf-kansai-2026-fsd/) (レギュラー枠 / FSD × Bebeu)

## イベント情報メモ

- 開催日: 2026-10-12 (月・祝) 10:00–20:00
- 会場: コングレスクエア グラングリーン大阪
- 応募締切: **2026-06-30 (火) 23:59**
- 応募先: https://fortee.jp/fec-kansai-2026/speaker/proposal/cfp
- セッション枠: レギュラートーク（30分）/ LT（5分）
- 言語: 日本語登壇
- 複数応募可（レギュラー × LT の重複採択は原則不可）

## 軸・構成（決定: 2026-06-21）

幹・ペルソナ・持ち帰り価値・5 分配分の構成は **[index.md](./index.md) の Memo セクションに集約**したのでそちらを参照。本ファイルは作業ログ・素材リスト・推敲メモ。

## 素材（このリポジトリ内）

- スクリプト本体: [scripts/build-sim-video.mjs](../../../../scripts/build-sim-video.mjs)
- justfile タスク: `just sim-video <deck> [speaker=30] [speed=0.9]`
- ナレーション一元化の転換コミット: `7102492 refactor(slides): 読み上げ台本をスピーカーノートに一元化（_script.md 廃止）`
- 差分ビルド: `_sim/.manifest.json` で音声 / PNG / segment 単位のハッシュ管理
- 適用済みデッキ例: [src/content/slides/2026-05-29-cfp-toudan-no-susume/](../../../slides/2026-05-29-cfp-toudan-no-susume/)

## 構成設計の経緯（story-structure Skill で詰めた要点）

- **幹の発見**: 当初「ノート × 自動化で登壇体験 UP」だったが、ユーザー提案で「スライド × 台本 = 発表のフロントエンド」という比喩に転換 → FE 文化 (テスト / DX) を逆方向に持ち込む構図に
- **概念の分離**: SRE 由来 (Toil 削減 / 本職) と Platform Engineering 由来 (DX 改善 / 個人実践中) を正確に分離。SSOT はソフトウェア設計全般の原則として独立扱い（PFE 固有としない）
- **イベントテーマ「Frontend, Unbounded.」との接続**: 詳細テーマ文の「画面の向こうに誰かがいる限り、地続き」を**意味通りに**借りる方針に。聴衆=画面の向こう、登壇者=制作者、登壇準備="フロントエンド"の仕事、と対応させる比喩。ペルソナを登壇する人全般まで開いた。直接コピペは避けて「地続き」「画面の向こう」の語彙を自分の言葉で再構成
- **山の選択**: 一元化 (E-1, SSOT 比喩) を山に。差分ビルド (HMR 比喩) は副次でチラッと

## 山にできそうな転換点（素材として保持）

1. 資料と台本を別管理 → スピーカーノートに一元化（二重管理の解消）= **採用: 山**
2. 全量再生成のたびに重い → 差分ビルドで「1ブロックだけ作り直し」可能に = **採用: 副次**
3. 「リハする」が儀式的 → 「毎回回せる」道具になる思想転換 = **R パートで触れる**

## 過去の関連素材

- 横断原則: [../../../../docs/learnings/playbook.md](../../../../docs/learnings/playbook.md)
- CfP プレイブック: [../../../../docs/cfp/playbook.md](../../../../docs/cfp/playbook.md)
