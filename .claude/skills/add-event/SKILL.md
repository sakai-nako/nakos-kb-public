---
name: add-event
description: イベントページの URL（connpass / fortee / 公式サイト等）から src/content/events/ のイベントコンテンツを作成するワークフロー。「イベント追加して」「このイベント登録して」「events に入れて」のような合図 + URL で起動。WebFetch でイベント名・開催日時を取得 → 重複チェック → frontmatter 案（slug / UTC 日時 / how_relate の仮説）を提示 → 確認 1 往復 → ファイル生成、を実行する。日時は JST から UTC への変換を必ず行う。
---

# Add Event Workflow（イベントコンテンツの取り込みフロー）

イベントページの URL から [src/content/events/](../../../src/content/events/) のイベントファイルを作成するワークフローです。スキーマの SSOT は [src/content/config.ts](../../../src/content/config.ts) の `events` コレクション。本スキルは取り込みの段取りだけを規定します。

## 起動条件

- 「イベント追加して」「このイベント登録して」「events に入れて」+ URL
- CfP 応募・登壇準備・参加登録の流れから「イベントのコンテンツも作っておいて」という発言
- URL がなくても成立する（イベント名・日時をユーザーに確認する。`event_link` は nullish 可）

## ファイル規約

- 1 イベント = 1 ファイル。`src/content/events/YYYY-MM-DD-<slug>.md`
  - 日付は **JST での開催初日**（frontmatter の UTC 日時と混同しない）
  - slug は kebab-case で短く。シリーズものは既存の命名に揃える（例: `ai-driven-development-kobe-5`, `coderabbit-osaka-2` のように回数を接尾辞に）
- 本文は書かない（**frontmatter のみ**）。既存ファイル全件がこの形式
- frontmatter:

```yaml
---
event_name: "<正式イベント名>"
start_datetime: "YYYY-MM-DDTHH:mm:ssZ" # UTC
end_datetime: "YYYY-MM-DDTHH:mm:ssZ"   # UTC
event_link: "<URL>"
how_relate:
  - "<関わり方>"
---
```

- `how_relate` の既存語彙: `organizer` / `speaker` / `attendee` / `cfp_submitter`（複数可。例: 登壇者かつ運営なら両方）。新しい値を増やすときはユーザーに確認する
- **日時は必ず JST → UTC 変換する**（JST − 9 時間）。connpass 等の表示は JST。例: JST 19:00 開始 → `T10:00:00Z`

## 手順（チェックリスト）

### 1. イベント情報の取得

- [ ] WebFetch でイベントページを取得し、正式イベント名・開催日時（開始/終了）・開催形態を把握する
- [ ] 取得できない場合（ログイン必須等）はユーザーにイベント名と日時の貼り付けを依頼する
- [ ] 同じイベントが既にないか [src/content/events/](../../../src/content/events/) を Grep で確認する（URL とイベント名の両方で。あれば新規作成せず更新を提案）

### 2. frontmatter 案の下書き

- [ ] ファイル名（開催日 + slug）と frontmatter を組み立てる。日時の UTC 変換をここで行い、変換前の JST 表記も確認用に添える
- [ ] `how_relate` の仮説を立てる。ユーザーの関わりはページからは分からないことが多いので、文脈から推測する:
  - 運営コミュニティ（Jagu'e'r 関西分科会、AI 駆動開発勉強会 神戸支部。最新は [profile.md](../../../src/content/about/profile.md) 参照）のイベント → `organizer`
  - CfP 応募の会話の流れ → `cfp_submitter`
  - 登壇準備の流れ → `speaker`
  - 手がかりがなければ `attendee` を仮置きして確認に回す

### 3. 確認（1 往復だけ）

ファイル名 + frontmatter 案（JST 日時の確認用併記付き）を提示し、聞くことは 1 メッセージにまとめる:

1. `how_relate` はこれで合っている？（仮説が当たっていれば「OK」で済む）
2. イベント名・slug に直したいところは？

### 4. ファイル生成

- [ ] `src/content/events/YYYY-MM-DD-<slug>.md` を frontmatter のみで作成
- [ ] `pnpm astro sync` でスキーマエラーが出ないか確認する

### 5. クローズ

- [ ] コミットを提案する（例: `docs(events): <イベント名>を追加`）

## 関連コンテンツへの接続（このスキルの対象外）

events は各コレクションの hub（[rules/30-architecture.md](../../rules/30-architecture.md)）。イベントファイル作成後、流れに応じてポインタだけ示す:

- CfP に応募する → `src/content/cfp/<slug>/` は別途作成（[docs/cfp/playbook.md](../../../docs/cfp/playbook.md) 参照）。cfp の frontmatter `event:` にこのイベント id を入れる
- 登壇スライドを作る → `src/content/slides/<slug>/` の frontmatter `event:` に同上
- 発表資料を外部公開した → `src/content/presentation_material/` に追加
- イベントが終わった → 振り返りは [retro Skill](../retro/SKILL.md)

## 振る舞いの注意

- **確認は 1 往復で止める。** frontmatter 5 フィールドだけの小さなコンテンツなので、尋問にしない
- **日時の変換ミスが一番の事故ポイント。** 確認メッセージでは必ず「JST 表記 → UTC 表記」を併記してユーザーが検算できるようにする
- タイムゾーンが JST でないイベント（海外カンファレンス等）は、現地時刻と UTC の対応をユーザーに明示して確認する
- 開催日時が未確定のイベント（ティザーサイトのみ等）は、判明している範囲で作らず、確定を待つか仮日時であることをユーザーに確認する
