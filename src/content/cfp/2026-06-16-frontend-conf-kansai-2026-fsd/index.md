---
title: "フロントエンド発の FSD、ゲームエンジンで使える？ ─ Rust と AI 駆動開発が増幅した越境の話"
submitted_at: "2026-06-16"
event: "2026-10-12-frontend-conf-kansai-2026"
---

## トークタイトル（70文字以内）

フロントエンド発の FSD、ゲームエンジンで使える？ ─ Rust と AI 駆動開発が増幅した越境の話

## トーク概要（1000文字以内）

「画面の向こうに誰かがいる限り、地続き」 ─ そのテーマに乗らせてください。

本職はインフラエンジニアで SRE をやっています。今日は、フロントエンドで広まったアーキテクチャ Feature-Sliced Design (FSD) を、Rust + Bevy + Dioxus desktop のゲームエンジンエディタ「Bebeu」(個人開発) に持ち込んでみた話を 30 分で。

## フロントエンド発の FSD を、ゲームエンジンに持ち込んでみる

FSD は比較的新しい FE アーキテクチャです。app / pages / widgets / features / entities / shared という 6 つのレイヤーに分け、同レイヤー間の依存を禁止することで「どこに置くか」を機械的に決める設計思想。FSD の世界では Steiger という公式 linter (JS/TS の FE で動く) で encapsulation を守る選択肢があります。

しかしゲームエンジンのエディタは Rust で書かれた Desktop アプリ。Web ではなく、ましてや TS でもない。それでも FSD の決定木はそのまま使えるのか？

## やってみた ─ Rust の `mod` 可視性で、コンパイラが encapsulation を守る

Bebeu の editor を `slice.rs` + `slice/` の facade パターンで組み直したら、deep-import 違反がそのまま build error になりました。FSD の世界で linter が頑張っていた encapsulation の強制が、Rust では標準で手に入る。フロントエンド発の架構が、ゲームエンジンエディタで予想以上にハマりました。

## さらに ─ 機械可読な決定木は、自分にも AI にも効く

「どこに置く?」「どこにある?」がレイヤー名で機械的に決まるので、半年後に戻ってきた自分が迷わない。AI エージェントへの prompt も短く済む。AI が deep-import してきても Rust が即 build error で止めてくれる。

## 持ち帰り

フロントエンドで生まれたアーキテクチャは、ゲームエンジン (Rust + Bevy + Dioxus) でも通用する。むしろ Rust のコンパイラと AI 駆動開発で増幅される。3 つの守護者 ─ FSD の決定木 / Rust のコンパイラ / AI 駆動開発との相性 ─ を、フロントエンド越境の実例として持ち帰ってください。

リポジトリ (公開ミラー): github.com/sakai-nako/Bebeu

## Memo

**トーク時間:** レギュラートーク（30分）
**題材:** [Bebeu](https://github.com/sakai-nako/Bebeu) を元にした Feature-Sliced Design (FSD) の実践
**応募先:** https://fortee.jp/fec-kansai-2026/speaker/proposal/cfp
**応募締切:** 2026-06-30 (火) 23:59
**カンファレンステーマ:** Frontend, Unbounded. / フロントエンドは、みんなの話やで。

### 幹（一文）

「フロントエンド発の FSD を、ゲームエンジン (Rust + Bevy + Dioxus) のエディタに持ち込んだら、Rust のコンパイラ強制と AI 駆動開発の両方が新しい守護者になった」。

2 つの越境: ①ドメイン（Web FE → デスクトップ / ゲームエンジン）が主役 / ②実装（FSD コミュニティの主戦場である JS/TS → Rust）が副次。

3 つの守護者: ①FSD の決定木（機械可読な配置）/ ②Rust のコンパイラ（FSD の世界では Steiger 等の linter が担う encapsulation 強制をネイティブで）/ ③AI 駆動開発との相性

### 対象（ペルソナ）

- FE エンジニアで FSD に興味あり／採用検討中の人
- Rust / Dioxus desktop アプリ開発者（少数だが熱量高い）
- 個人開発でアーキテクチャに悩んでいる人
- AI 駆動開発で「AI のコード配置が迷子になる」に心当たりがある人

### 持ち帰り価値

- メイン: 「フロントエンド発のアーキテクチャがゲームエンジンエディタで通用する ─ 配置を機械的に決める文化はデスクトップ Rust + AI 駆動開発で増幅される」越境体験
- サブ: Rust の `mod` 可視性で FSD を「コンパイラに守らせる」翻案レシピ
- サブ': AI にも自分にも効く「機械可読な決定木」という設計思想

### 避けたいこと

- FSD の概念解説で時間を食いすぎる（ある程度しっかり扱う方針だが過多は禁物）
- Rust 詳細 / Bevy / Dioxus の細部に潜って聴衆を置き去りにする
- 「皆さんよく知ってる FSD」のような前提押し付け（FSD は比較的新しい概念）
- FSD origin を「TS 発」と不正確に語らない（公式は framework / language 非依存、FE プロジェクト向け methodology と明言。実態として JS/TS 界隈で採用例が多いだけ）
- TS との比較で TS 側を deep に説明しすぎる（聴衆に Steiger 経験者は少ない想定）

### 構成の型

フック先出し + 二山構造（PREP に近いが Reason → Example ×2 → Point の重み）

### 流れ（30 分配分）

- **フック + 自己紹介 + Bebeu 紹介 (0:00–3:00)**: テーマ呼応「画面の向こうに誰かがいる限り、地続き」+ 越境宣言（インフラ屋・SRE が FE の話を持ってきた）+ Bebeu（Rust + Bevy + Dioxus desktop の個人ゲームエンジン）の世界観をスクショ 1 枚で共有
- **FSD 概念きっちり (3:00–8:00)**: 「Feature-Sliced Design は比較的新しい FE アーキテクチャ」と正直に切り出す（origin は framework 非依存だが FE 向け / 実態として JS/TS の React/Vue 界隈で広まっている）/ 6 layer（app / pages / widgets / features / entities / shared）/ 同レイヤー間の slice 依存禁止 / FSD の世界では Steiger という公式 linter (JS/TS の FE で動く) で encapsulation を守る選択肢
- **持ち込み動機 (8:00–10:00)**: Bebeu の editor で多ドメイン（Character / SpriteGroup / Animation / Effect 等）+ CRUD feature 増殖の予感 / 配置をその都度判断したくない
- **★山①: Rust 翻案 (10:00–18:00)**: facade パターン / `slice.rs` + `slice/` ディレクトリ流儀（`mod.rs` 不使用）/ `pub mod` 禁止で内部隠蔽 / FSD の世界で linter が担っていた encapsulation を Rust の `mod` 可視性が「コンパイラで強制」/ deep-import 違反 = build error / 「Web 発の架構がゲームエンジンエディタで予想以上にハマった」をオチに置く
- **★山②: 機械可読な決定木の恩恵 ─ AI にも自分にも (18:00–24:00)**: 「どこに置く?」「どこにある?」が機械的に決まる / 自分: 半年後の復帰コストが低い（個人開発の現実的価値）/ AI: prompt が短く済む + deep-import を Rust が build error で止める / FSD 世界の linter との対比は軽く（Rust の優位を示す程度）
- **振り返り + 結論 (24:00–28:00)**: 3 つの守護者を得た越境ストーリー / 「持ち込んだら思った以上に効いた」 / 持ち帰り（フロントエンド発のアーキテクチャはゲームエンジンでも通用する / FSD 公式エコシステムでも Steiger 使えば近づけるが Rust だと標準で手に入る）
- バッファ + Q&A 誘導 (28:00–30:00)

### 焦点化

一人称・内的（「Bebeu で試した」「思った以上に効いた」）。"べき論"の俯瞰解説にしない。

### 削った素材 → 退避先

- ADR-0003（DDD 集約ルート ⇔ FSD slice の 1:1 対応） → Q&A 退避
- ADR-0002（synchronous-only data flow）など他 ADR → Q&A / ブログ
- Dioxus の reactivity / undo-redo / OOUI 等の周辺話題 → Q&A
- Bevy 側（engine）の話 → 今回は editor のみに絞る
- AI エージェントの具体ツール名（Claude Code / Cursor 等） → 抽象的に「AI エージェント」で扱う
