---
title: モノレポ × AntigravityでOSSへ踏み出す
draft: false
theme: seriph
fonts:
  sans: Mochiy Pop P One
  serif: Mochiy Pop P One

eventName: AI駆動開発勉強会 神戸支部 第1回
eventDate: 2026-01-23
speakerName: 太田 有人 （sakai-nako）
presentation_time_minutes: 30

duration: 30
---

<style>
.slidev-layout {
  text-align: left;
}
</style>

# {{ $frontmatter.title }}

<br><br>

<TitleFooter 
  :eventName="$frontmatter.eventName" 
  :eventDate="$frontmatter.eventDate" 
  :speakerName="$frontmatter.speakerName" 
/>

---
layout: two-cols
duration: 150
---

# 自己紹介

### 太田有人（sakai-nako）

<img src="/slide-images/profile-composite-01.jpg" alt="プロフィール写真" class="my-4 w-[95%]">

<div class="flex gap-2 mt-4 justify-center w-[95%]">
  <img src="/slide-images/professional-cloud-architect.png" alt="Google Cloud Certified - Professional Cloud Architect" class="h-20" />
  <img src="/slide-images/professional-cloud-developer.png" alt="Google Cloud Certified - Professional Cloud Developer" class="h-20" />
  <img src="/slide-images/professional-cloud-devops-engineer.png" alt="Google Cloud Certified - Professional Cloud DevOps Engineer" class="h-20" />
</div>


::right::

<style>
li {
  margin-top: 0.1rem;
  margin-bottom: 0.1rem;
}
li p {
  margin: 0.4rem 0;
}
</style>

- 1987年生まれ　ずっと京の都に住んでいる
- コンビニバイト10年の後、IT業界に飛び込む
- 略歴

    1社目: システムエンジニア (派遣、2017～2021)<br>↓<br>フェンリル: クラウドエンジニア<br>in [GIMLE](https://www.fenrir-inc.com/jp/business/gimle/) Team (2022～2024/6)<br>↓<br>フェンリル: （クラウド）インフラエンジニア<br>in [NILTO](https://www.nilto.com/ja) Team (2024/7～)

- 「理想の彼女がいなければ、自分で作ればいいじゃない」と思い立ち、女装を始める
- ここ数年はRustにハマリ気味
- AI駆動開発勉強会 神戸支部 運営 <br>Jagu'e'r 関西分科会 運営
- [個人サイト](https://hack-pleasantness.com/)（リニューアル中……AI駆動で進行スピードUP!）

<!-- 

はい、まずは自己紹介からはじめさせてください。

（内容）

 -->

---
duration: 60
---

# おしながき

<style>
li {
  font-size: 1.5rem;
}
</style>

1. 自己紹介
2. Antigravityとは?
3. 題材: Ebeuプロジェクト
4. モノレポでの開発Tips
5. OSS化の準備
6. デモ
7. まとめ

---
layout: section
duration: 10
---

# Antigravityとは?

---
duration: 140
---

# Antigravityとは?

- **Google発のAI駆動開発ツール**（VSCodeフォーク系IDE）
- 使えるモデル
  - Gemini 3 (Pro / Flash)
  - Claude (Sonnet / Opus)
  - GPT-OSS-120B
- **Artifacts**: AIエージェントが出力する成果物
  - 一連の作業の流れに沿って、ファイルを作成・変更
    - Implementation Plan（実行計画）
    - Task List（ToDoリスト）
    - Walkthrough（変更サマリ）
  - Task Listの処理中も、ファイルの変更差分が随時確認可能
- **Agent Skills** も使えるようになった!（2026/1/13～）

---
duration: 140
---

# Antigravityとは?

## Antigravityの料金・制限

<br>

<div class="grid grid-cols-2 gap-8">
<div>

### 無料版（Googleアカウント）
- ⚠️ すぐに制限に達しがち
- モデルを切り替えると継続できる
  - ただし、同じセッションを別のモデルに引き継ぐと、ちょっと挙動が怪しくなったり……
- ちょっとした作業・お試し向け

</div>
<div>

### Google AI Pro（月額￥2,900）
- ✅ ガッツリ開発するなら必須
- 各モデルの利用上限が大幅UP
- 制限をあまり気にせず作業に集中できる
  - Claude系モデルは、Gemini3に比べると早めに制限かかる印象なのでバランス注意
  - ちなみに、Claude Opusで制限がかかるとSonnetも使えなくなる

</div>
</div>

<div class="mt-8 text-center text-xl">

💡 **本格的に使うなら、少なくとも Google AI Pro は必要!**

</div>

---
layout: section
duration: 15
---

# 題材: Ebeuプロジェクト

---
duration: 120
---

# 題材: Ebeuプロジェクト

### Ebeu: <span class="text-blue-400 font-bold">E</span>bitengine <span class="text-blue-400 font-bold">b</span>eat '<span class="text-blue-400 font-bold">e</span>m <span class="text-blue-400 font-bold">u</span>p

- **2Dアクション/ベルトスクロールゲーム用ツールキット**
- OSS化を視野に入れて開発中（約1ヶ月）

<figure class="flex flex-col items-center">
  <img src="/slide-images/ebeu-editor-001.png" alt="Ebeu Editor screenshot" class="my-2 w-[50%]" />
  <figcaption class="text-sm text-center">
    エディタのスクショ（エンジンはまだ動かせてません……）<br>
  </figcaption>
</figure>

<div class="flex justify-center">
  <p class="text-xs text-gray-400">※キャラクターの画像は CC0 1.0 Universal (パブリックドメイン) のものです</p>
</div>

---
duration: 70
---

# 題材: Ebeuプロジェクト

### 技術スタック
| コンポーネント | 技術 |
|---------------|------|
| エディタ | Rust + Dioxus |
| エンジン | Go + Ebitengine |
| データ定義（スキーマ） | YAML (+JSON Schema) |

<br>

### なぜモノレポ?
- Editor / Schema / Engine を一括管理
- AIエージェントが全体を把握しやすい
- 私がモノレポ好きだから

---
layout: section
duration: 10
---

# モノレポでの開発Tips

---
duration: 160
---

# モノレポでの開発Tips

### 相性の良いポイント

- **プロジェクト名を認識**させると普通に答えてくれる
- **サブモジュール内のSkill**もちゃんと読み込んでくれる
- 複数パッケージ間の依存関係を理解して修正してくれる
  - Schema変更 → Editor/Engine側も追従して変更……など

<br>

### 工夫したこと

- エージェント用ルールファイル（`.agent/rules/`）の整備
  - なぜ、そのファイル構成・内容がいいのかをエージェント自身に確認
- Skill / Workflow 定義の活用
  - [skill-creator](https://github.com/anthropics/skills/tree/main/skills/skill-creator) をベースにカスタマイズ
- データ定義をYAML + JSON Schemaで管理
  - 人間もAIも読みやすい形式で型を共有

---
duration: 120
---

# モノレポでの開発Tips

### 注意点

<br>

#### **シェル設定の問題**
  - エージェントが使うのは統合ターミナルのデフォルトシェル
  - エディタとエージェントでシェルを分けられない
  - NuShell使いはちょっと困る…（私のことですw）
    - Mac+NuShellだとうまくコマンドが実行できなかったので、Bashに切り替えました
    
<br>

#### **コンテキストの肥大化**
  - 大きすぎるモノレポだと、関係ないコードも拾いがち
  - `.agent/rules/` で適切にスコープを絞る
    - 1ファイルにすべて詰め込まない
  - Agent Skillsを活用して、必要な部分だけを呼び出す

---
layout: section
duration: 10
---

# OSS化の準備も<br>Antigravityで

---
duration: 50
---

# OSS化の準備もAntigravityで

### 作成したドキュメント（ライセンス以外はバイリンガル対応）

| ドキュメント | 内容 |
|-------------|------|
| `README.md` / `README_ja.md` | プロジェクト紹介 |
| `CONTRIBUTING.md` / `_ja.md` | コントリビューションガイド |
| `CODE_OF_CONDUCT.md` / `_ja.md` | 行動規範 |
| `SECURITY.md` / `_ja.md` | セキュリティポリシー |
| `LICENSE-MIT` / `LICENSE-APACHE` | デュアルライセンス |

---
duration: 90
---

# OSS化の準備もAntigravityで

### どう進めたか?

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→段階的にドキュメントを拡充

1. **ソースコードから始める**

    →まずはコードとコメントを整備
   
2. **ルールファイルを整備**

    → `.agent/rules/` でプロジェクトの基本方針を定義
   
3. **READMEから広げていく**

    → ルールファイルを元にREADMEを作成し、そこから CONTRIBUTING, SECURITY等へ展開<br>
    → Alpha版としての表記も自然な感じにしてくれた<br>
    → バイリンガル化も依頼すると対応してくれる

💡 **定型的なドキュメントはAIに任せやすい!**

---
layout: center
duration: 505
---

# デモ

Ebeuエディタ × Antigravity でライブVibeコーディング

<!-- 

## デモ用プロンプト

Ebeu Editorに「CharacterPropertyPanel」コンポーネントを追加してください。

【要件】
- packages/editor/src/components/features/property_panel/ に新規作成
- 現在選択中のキャラクターの character.yml の内容を表示する
- 表示するフィールド:
  - name (キャラクター名)
  - scale
  - speed
  - speed_z
- 読み取り専用（表示のみ）でOK、編集機能は後で追加します
- 既存の property_panel の他コンポーネントのスタイルに合わせてください

## 流れ
1. 上記プロンプトを投げる
2. Implementation Plan を確認（さらっと）
3. 実装を見守る（4〜6分）
4. just check の自動実行を見せる
5. just editor-dev でエディタ起動、新パネル確認

-->

---
duration: 110
---

# まとめ

### Antigravity × モノレポ

- ✅ 相性は良い!全体を把握して適切に作業してくれる
- ✅ Artifacts（計画・タスク・まとめ）が便利
- ✅ Agent Skills で拡張可能

<br>

### ポイント

- 💰 ガッツリ使うなら **Google AI Pro** を検討
-  JSON Schemaなど型情報があるとAIが理解しやすい
- 🐚 シェル設定には注意（特殊シェル使いは要対策）

---
duration: 20
---

# ちょっとだけ宣伝

## ヘッドレスCMS作ってます!<br>（MCPサーバーもあるよ!!）

<figure class="flex flex-col items-center">
  <img src="/slide-images/nilto-qr-01.png" alt="NILTO QR Code" class="my-2 w-[30%]" />
  <figcaption class="text-sm text-center">
    よかったら触ってみてね<br>
  </figcaption>
</figure>

---
layout: center
class: text-center
---

# おしまい

<div class="mt-8">

ご清聴ありがとうございました!

</div>
