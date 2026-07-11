---
name: retro
description: イベント登壇・発信・CFP 採否の後に、計測データから retro（振り返りドキュメント）を作成し、playbook への昇格まで進めるワークフロー。「振り返りしたい」「retro 作って」「登壇の数字を見たい」「採否が出たので振り返る」のような合図で起動。docs/learnings/README.md の手順とテンプレを SSOT として、データ収集 → retro 作成 → 気づきの昇格判断 → 仮説の更新、をチェックリスト駆動で実行する。
---

# Retro Workflow（振り返り作成フロー）

イベント・発信・CFP の「計測データが一区切りついたタイミング」で振り返りを作るワークフローです。手順・テンプレ・昇格基準の SSOT は [docs/learnings/README.md](../../../docs/learnings/README.md)（§3 retro の書き方、§4 昇格基準）。本スキルはそれを対話的に実行する段取りだけを規定します。

## 起動条件

- 「振り返りしたい」「retro 作って」「retro 書きたい」
- 「登壇の数字を見たい」「アナリティクス見て」＋振り返り意図
- 「CFP の採否が出た」「不採択だったので次に活かしたい」
- 四半期棚卸し中に「この期間の retro がない」と気づいたとき（→ ユーザーに提案）

## 手順（チェックリスト）

上から順に。各ステップでユーザーに確認を取りながら進める（勝手に全部やらない）。

### 1. スコープ決定

- [ ] 対象期間（開始日・終了日）と中心イベントを確認する
- [ ] 対応する `src/content/events/` エントリの id を特定する（無ければ events 追加を先に提案）
- [ ] 既存 retro との重複がないか [docs/learnings/retros/](../../../docs/learnings/retros/) を確認する

### 2. データ収集

- [ ] X アナリティクス CSV の場所を確認する。ユーザーがまだエクスポートしていなければ依頼する
- [ ] 生データは `content-external/sns/x/data/` に置いてから参照する（retro の `sources` からの相対参照を切らさない）
- [ ] CFP 採否・登壇アンケート・URL クリック等、他のデータソースもあるか聞く

### 3. 分析

- [ ] 期間全体の推移（imp / エンゲージ / ポスト数）を日別テーブルにする
- [ ] 突出した個別事例（良い・悪い両方）を 3〜5 件抽出し、各 1 行で「なぜ」の仮説を添える
- [ ] **前回 retro の「次に試したい仮説」を必ず開き、今回のデータで検証できるものは結果を書く**（このステップを飛ばすとループが切れる）

### 4. retro 作成

- [ ] `docs/learnings/retros/YYYY-MM_<slug>.md` を README のテンプレどおりに作成
- [ ] frontmatter: `period` / `expires_at`（原則 3 ヶ月後）/ `status: active` / `sources` / `event_refs`
- [ ] 「次に試したい仮説」を検証可能な形（「X すると Y が変わるか」）で 2〜4 個残す

### 5. 昇格判断

- [ ] 各気づきを [README §4 の昇格基準](../../../docs/learnings/README.md)（抽象度・根拠・行動可能）と突き合わせる
- [ ] 基準を満たすものだけ [docs/learnings/playbook.md](../../../docs/learnings/playbook.md) に Why / How to apply 付きで転記し、retro 側に「昇格済」と明記
- [ ] 領域固有の学びは各領域の playbook（[docs/cfp/playbook.md](../../../docs/cfp/playbook.md) 等）へ
- [ ] 表記・言い回しのユーザー嗜好が出てきたら [rules/17-writing-style.md](../../rules/17-writing-style.md) へ（README §6 の書式）

### 6. クローズ

- [ ] retro と playbook の相互リンクを確認する
- [ ] コミットを提案する（例: `docs(learnings): 2026-08 <イベント名> retro を追加`）

## 振る舞いの注意

- **数値は生データから引く。** 記憶や推測で imp を書かない。CSV が読めないときは読めないと言う
- **昇格は絞る。** 1 retro から昇格するのは多くて 2〜3 個。迷ったら retro に置いたまま寝かせる（複数 retro で再現したら昇格）
- **サイト公開コンテンツではないので作業日付は書いてよい**（docs/ 配下は対象外 — [rules/16-content-locations.md](../../rules/16-content-locations.md) §4）
- テンプレの節を勝手に増減しない。増やしたくなったら README のテンプレ自体の更新を提案する
