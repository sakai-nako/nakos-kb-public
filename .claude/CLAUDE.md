# nakos-kb

## 全般

- ユーザーへの応答・説明はすべて **日本語** で行ってください（韓国語や英語は使わない）。
- 詳細な規約は [.claude/rules/](./rules/) 配下にあります。本ファイルはオーバービューと索引です。
- ユーザー（GitHub アカウント `sakai-nako`）自身の GitHub リポジトリ情報を参照する際は、`gh` コマンド（`gh repo view`, `gh pr list`, `gh issue view` など）を使用してください。Web 検索や URL 推測ではなく `gh` 経由で確実に取得します。
- **本リポジトリの origin はローカル GitLab**（`https://localhost:8930/sakai-nako/nakos-kb`。NixOSInfra distro 上の GitLab CE、インフラ定義は `~/Main/repos/local-new-infra-base/`）。GitLab 側の操作（CI 状態・変数管理等）は `glab` コマンドを使用してください（`glab ci list`, `glab variable list` など）。GitHub 側には バックアップ用の `github` リモート（private）と公開ミラー `nakos-kb-public`（サイトのデプロイはここの GitHub Actions から。「デプロイ」節参照）があります。origin には push URL が 2 つ設定されており（GitLab HTTPS + GitHub SSH）、`git push origin` だけで両方に push されます（バックアップの同期漏れ防止。ローカル git config なのでクローンし直したら再設定が必要）。
- ローカルのベアリポジトリ（`~/Main/bare-repos/` 配下、現状 `comui-inputs/`, `game-workspace/`, `local-accounting/`, `local-game-workspace/`, `qwen-pose-cli/`）を参照する際は `git -C <path> <command>` で直接アクセスしてください。working tree が無いため、ファイル内容は `git -C ~/Main/bare-repos/<name> show <ref>:<path>` で、ツリー一覧は `git -C ~/Main/bare-repos/<name> ls-tree -r <ref>` で取得します。`.git` 接尾辞は付かない点に注意（ディレクトリ自体がベア）。

## プロジェクト概要

**nakos-kb** は Astro 製の個人ナレッジベース兼プレゼン資料サイトです。

- イベント情報・CfP・発表資料・登壇資料（Slidev スライド）・自作小説・ブログ記事（準備中）を一箇所に集約
- すべてリポジトリ内 Markdown で管理し、Astro Content Collections で型安全に扱う（CMS なし）
- Slidev で書いたスライドをビルド時に静的書き出しし、Astro サイト内で公開
- Cloudflare Pages にデプロイ

## 技術スタック（要点）

| 項目               | 採用                                                                  |
| :----------------- | :-------------------------------------------------------------------- |
| **Framework**      | [Astro](https://astro.build/) v5.x (Static Site, TypeScript)          |
| **Slides**         | [Slidev](https://sli.dev/) v52 系                                     |
| **Styling**        | 素の CSS（Astro のスコープ付き `<style>`）。Tailwind / Sass は未導入  |
| **Package Manager**| **pnpm**（`packageManager: pnpm@10.x`、`pnpm-lock.yaml`）             |
| **Task Runner**    | [just](https://just.systems/)（シェルは NuShell）                     |
| **Lint / Format**  | ESLint + Prettier                                                     |
| **Deploy**         | Cloudflare Pages（公開ミラー `nakos-kb-public` の GitHub Actions。[deploy.yml](../.github/workflows/deploy.yml)）|

詳細は [rules/10-tech-stack.md](./rules/10-tech-stack.md) を参照してください。

## ディレクトリ構成

```
nakos-kb/
├── .claude/
│   ├── CLAUDE.md              # 本ファイル（AI エージェント向けオーバービュー）
│   ├── rules/                 # 詳細ルール（番号体系は README.md 参照）
│   ├── storytelling/          # ストーリー構成フレームワーク（SSOT。ブログ/スライド/小説横断）
│   ├── anti-slop/             # AI Slop 対策フレームワーク（SSOT。公開前レビュー観点）
│   ├── coherence/             # 文章の接続度（coherence / cohesion）レビューフレームワーク（SSOT）
│   ├── skills/                # Skill（story-structure, novel-revision, slop-review, coherence-review 等）
│   └── agents/                # SubAgent（blog/slide/novel-architect）
├── .github/workflows/
│   └── deploy.yml             # Cloudflare Pages デプロイ（公開ミラー側で実行される）
├── .gitlab-ci.yml             # ローカル GitLab CI（品質チェックのみ）
├── public/                    # 静的アセット（そのまま配信）
├── scripts/
│   ├── build-slides.mjs       # Slidev 一括ビルド
│   ├── setup-slides.mjs       # 各デッキへ _shared/ の junction とコピーを冪等に展開
│   ├── novel-export-kakuyomu.mjs  # 小説章 → カクヨム形式変換
│   ├── check-content.mjs      # コンテンツの機械的スタイル検査（rules/17 §7 対応）
│   ├── sns-check.mjs          # X 投稿（生標）の未放流チェック + 今日のセクション準備（SessionStart フックからも利用）
│   └── build-sim-video.mjs    # リハーサル動画生成（VOICEVOX + Slidev + ffmpeg）
├── src/
│   ├── assets/                # グローバル画像・フォント等
│   ├── content/
│   │   ├── config.ts          # Content Collections 定義
│   │   ├── blog/              # ブログ記事置き場（プレースホルダーのみ。コレクション未定義・ページ未実装）
│   │   ├── slides/            # Slidev 原稿（デッキごとに <name>/index.md。共有アセットは _shared/）
│   │   ├── events/            # イベント情報（frontmatter のみ）
│   │   ├── cfp/               # CfP 応募メタ + abstract / memo
│   │   ├── presentation_material/  # 外部公開した発表資料へのリンク（Docswell, Slidev, note 等）
│   │   ├── novels/            # 自作小説（作品ごとに <slug>/index.md + NN-章.md。rules/35-novels.md 参照）
│   │   └── about/             # プロフィール・自己観察ドキュメント
│   ├── features/              # 機能単位の UI ロジック
│   │   ├── about/             #   └ About ページ表示
│   │   ├── event/             #   └ イベント表示
│   │   ├── navigation/        #   └ ナビゲーション
│   │   ├── novel/             #   └ 小説表示（共通記法レンダラー含む）
│   │   ├── slide/             #   └ スライド一覧
│   │   └── welcome/           #   └ トップページのウェルカム
│   ├── layouts/
│   │   └── Layout.astro       # 全ページ共通レイアウト
│   ├── lib/                   # 汎用ユーティリティ置き場（現状空）
│   └── pages/                 # ファイルベースルーティング（Thin Wrapper）
│       ├── index.astro
│       ├── about/{index,[slug]}.astro
│       ├── events/{index,[id]}.astro
│       ├── novels/{index,[novel]/index,[novel]/[chapter]}.astro
│       └── slides/index.astro
├── content-external/          # ミラー・デプロイ対象外（public-mirror-rules で除外）。サイトに出さないが外部プラットフォームに出すコンテンツ
│   ├── articles/              # ── 記事・エッセイの下書き（note 等が本番）
│   ├── community/             # ── コミュニティ運営関連のコンテンツ（運営blog記事等）
│   ├── sns/                   # ── SNS 投稿の下書き・アーカイブ
│   ├── assets/                # ── 下書きで使う画像等
│   └── cv/                    # ── 履歴書・職務経歴書（Typst。外部提出物）
├── content-private/           # ミラー・デプロイ対象外（public-mirror-rules で除外）。完全 private（外にも出さない）
│   ├── about-sakai-nako/      # ── 自己分析メモ（self-portrait 元データ + swot）
│   ├── clippings/             # ── 外部記事×自分の関連の蓄積（clip Skill で取り込み。アウトプットの素材）
│   ├── other/                 # ── その他 private 資料
│   └── scratch/               # ── 雑メモ（_scratchpad, idea, sns-and-self-introduction）
├── docs/                      # ミラー・デプロイ対象外（public-mirror-rules で除外）。運用ドキュメント
│   ├── content-restructure.md # ── コンテンツ再編成（4 分類）の追跡ドキュメント
│   ├── cfp/                   # ── CfP playbook（応募の勝ちパターン等）
│   └── learnings/             # ── 学び・振り返りの蓄積（README.md = 改善ループ運用ガイド, playbook.md, retros/）
├── astro.config.mjs
├── justfile
└── package.json
```

コンテンツ／ドキュメントの 4 分類（src/content, content-external, content-private, docs）の判断基準と再編成の経緯は [docs/content-restructure.md](../docs/content-restructure.md) を参照してください。アーキテクチャ規約（`features` / `layouts` / `pages` の依存方向など）は [rules/30-architecture.md](./rules/30-architecture.md) に従ってください。小説の扱いは [rules/35-novels.md](./rules/35-novels.md) を参照してください（2026-06 から `src/content/novels/` に置き、サイトの `/novels/` ページとして公開）。

## Content Collections

[src/content/config.ts](../src/content/config.ts) で以下のコレクションが定義されています。すべてリポジトリ内 Markdown で、外部 CMS には依存しません（`slides` / `about` のみ legacy の `type: 'content'`、他は `glob()` loader）。

| 名前                   | 配置                                                                 | 説明                                                       |
| :--------------------- | :------------------------------------------------------------------- | :--------------------------------------------------------- |
| `slides`               | [src/content/slides/](../src/content/slides/)                        | Slidev 原稿（デッキごとに `<slug>/index.md`）              |
| `events`               | [src/content/events/](../src/content/events/)                        | イベント・カンファレンス参加履歴                           |
| `cfp`                  | [src/content/cfp/](../src/content/cfp/)                              | CfP 応募の提出本文（`<slug>/index.md`。採択／不採択も残す） |
| `cfp_drafts`           | [src/content/cfp/](../src/content/cfp/)                              | CfP 応募の校正過程（`<slug>/drafts.md`。Round ログ + 旧案 + 留意事項） |
| `presentation_material`| [src/content/presentation_material/](../src/content/presentation_material/) | 外部公開した発表資料のメタ（Docswell, Slidev, note 等）|
| `novels`               | [src/content/novels/](../src/content/novels/)                        | 自作小説の作品メタ（`*/index.md`）                         |
| `novel_chapters`       | [src/content/novels/](../src/content/novels/)                        | 自作小説の章（`*/NN-*.md`。`_` 始まりは対象外）            |
| `about`                | [src/content/about/](../src/content/about/)                          | プロフィール・自己観察ドキュメント                         |

なお [src/content/blog/](../src/content/blog/) はプレースホルダー（`hello-world.md` のみ）で、**コレクション定義・公開ページとも未実装**です（Header のリンクもコメントアウト中）。

**リレーションは events を hub にした片方向参照**：`cfp` / `presentation_material` / `slides` は frontmatter で `event: <event-slug>` を持ち、Astro の `reference('events')` で型安全に結合。逆引きは `getCollection('cfp', e => e.data.event?.id === eventId)` のパターン。詳細は [rules/30-architecture.md](./rules/30-architecture.md) を参照。

## よく使う just コマンド

`justfile` はリポジトリルートにあります。必ず `just` 経由で実行してください（直接 `pnpm` を叩くのは非推奨）。

| コマンド            | 内容                                                   |
| :------------------ | :----------------------------------------------------- |
| `just install`      | 依存インストール（`pnpm install`）                     |
| `just dev`          | Astro 開発サーバー起動                                 |
| `just build`        | Astro 本体ビルド + Slidev ビルド                       |
| `just build-slides` | Slidev のみビルド                                      |
| `just preview`      | ビルド成果物のローカルプレビュー                       |
| `just check`        | ESLint + Prettier チェック                             |
| `just check-content`| コンテンツの機械的スタイル検査（ベタ詰め / CFP 装飾・所要時間 / 見出しの作業日付。規約は [rules/17-writing-style.md](./rules/17-writing-style.md) §7） |
| `just format`       | Prettier で整形                                        |
| `just lint`         | ESLint のみ実行                                        |
| `just slidev <name>`| 単一デッキを Slidev 開発サーバーで開く（`<name>` は [src/content/slides/](../src/content/slides/) 配下のディレクトリ名。`draft: true` なデッキも同じコマンドで開ける） |
| `just setup-slides` | 各デッキディレクトリに `_shared/` への junction とコピーを冪等に展開。`_shared/global-bottom.vue` などを編集したら再実行 |
| `just sns`          | X 投稿（生標）の未放流チェック + 今日のセクションを `content-external/sns/x/content/<year>.md` に用意（本文が空のうちは未放流扱いのまま） |
| `just sns-status`   | X 投稿（生標）の未放流チェックのみ                     |
| `just novel-kakuyomu <file>` | 小説の章をカクヨム形式に変換して stdout へ（`\| clip` でクリップボードにコピー） |
| `just blog-to-zenn <slug>` | blog 記事を Zenn 形式に変換して stdout へ（emoji / type は `platforms.zenn` または既定値、本文冒頭に canonical 注記を自動挿入） |
| `just cv` / `just cv-watch <name>` | 履歴書・職務経歴書 PDF を Typst でビルド（出力先: `content-external/cv/out/`） |
| `just sim-video <deck>` | デッキのリハーサル動画を生成（VOICEVOX + Slidev + ffmpeg）。`draft: true` のデッキでも回せる |

## デプロイ

サイトのデプロイは **公開ミラー起点** です。`main` への push だけではサイトは更新されず、`/publish-public-mirror` でフィルタ済みスナップショットを `nakos-kb-public`（GitHub）に push すると、そこで [deploy.yml](../.github/workflows/deploy.yml)（GitHub Actions）が動いて wrangler の direct upload で Cloudflare Pages にデプロイされます。フィルタ（[scripts/public-mirror-rules.psd1](../scripts/public-mirror-rules.psd1) の除外パス + 禁止パターン検査）を通ったものだけがサイトになるため、**個人情報の安全網がサイト公開の手前でも効く**構成です。

- **サイトを更新したいとき**: main にコミット → `/publish-public-mirror` を実行（これがデプロイのトリガー）
- deploy.yml は private 側で管理し、ミラーに配布されて実行されます。`if: github.repository == 'sakai-nako/nakos-kb-public'` のガードに加え、バックアップ用 private GitHub リポジトリは **Actions 自体を無効化済み**（リポジトリ設定）なので二重に動きません
- `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` は **nakos-kb-public の Actions Secrets** にのみ存在します
- ローカル GitLab の CI（[.gitlab-ci.yml](../.gitlab-ci.yml)）は品質チェック（`pnpm check` + `check-content`）のみで、デプロイには関与しません

## 環境変数

ローカル開発で必須の環境変数はありません（CMS 連携の `NILTO_API_KEY` 等は2026年5月の移行で撤去済み）。デプロイ用の Cloudflare トークンは公開ミラー `nakos-kb-public` の GitHub Actions Secrets のみに存在します（上記「デプロイ」参照）。秘密情報の扱いは [rules/80-security.md](./rules/80-security.md) を必ず確認してください。

## ストーリー構成フレームワーク

ブログ・発表資料・小説に共通する「ストーリー構成」の設計フレームワークを [.claude/storytelling/](./storytelling/) に集約しています（物語論ベースの SSOT）。構成づくり・レビューの依頼が来たら [story-structure Skill](./skills/story-structure/SKILL.md)、ゼロからのドラフト生成や自律レビューは媒体別 SubAgent（[blog](./agents/blog-architect.md) / [slide](./agents/slide-architect.md) / [novel](./agents/novel-architect.md)-architect）。起動指針は [rules/36-storytelling.md](./rules/36-storytelling.md)。

## AI Slop 対策

AI で下書きしたブログ・発表資料・SNS から「AI 臭」を抜くための観点・語彙・パターン集を [.claude/anti-slop/](./anti-slop/) に集約しています。公開前レビューの依頼（「AI 臭抜きたい」「校正して」「最終チェック」等）が来たら [slop-review Skill](./skills/slop-review/SKILL.md) を起動。**小説は対象外**で、文章の磨き込みは [novel-revision Skill](./skills/novel-revision/SKILL.md) が担当します。起動指針は [rules/37-anti-slop.md](./rules/37-anti-slop.md)。

## 接続度（Coherence）レビュー

文章の要素（段落・文・句）間の **接続度** を Halliday & Hasan の cohesion / coherence と Rhetorical Structure Theory の接続タイプ語彙で診断・改善するフレームワークを [.claude/coherence/](./coherence/) に集約しています。「接続度を見て」「つながりが弱い」「論理が飛躍している」「先出しした情報が後で生きない」のような合図で [coherence-review Skill](./skills/coherence-review/SKILL.md) を起動。**story-structure（マクロな流れ）と slop-review（語彙・記号）の中間** ── 要素間の意味接続だけに集中します。**小説は対象外**（意図的な飛躍が作家性として機能するため）。起動指針は [rules/38-coherence.md](./rules/38-coherence.md)。

## 改善ループ（Learnings）

「作る → 出す → 測る → 学ぶ → 規約化する」の改善ループの運用手順を [docs/learnings/README.md](../docs/learnings/README.md) に集約しています（ループの地図・retro テンプレ・playbook 昇格基準・四半期棚卸しチェックリスト）。イベント後の振り返りは [retro Skill](./skills/retro/SKILL.md)、四半期末の棚卸しは [quarterly-review Skill](./skills/quarterly-review/SKILL.md) を起動。ユーザーフィードバック由来の表記規約は [rules/17-writing-style.md](./rules/17-writing-style.md) が SSOT で、機械検査できるものは `just check-content` が守ります。**学びの SSOT は必ずリポジトリ内に置き、エージェントのローカルメモリにはポインタだけを残す**のがこのリポジトリの方針です。

## `.claude/rules/` 索引

ルールファイルは番号順に読み込み優先度が上がります（番号体系の詳細は [README.md](../README.md) を参照）。

| ファイル                                                           | 内容                                                 |
| :----------------------------------------------------------------- | :--------------------------------------------------- |
| [00-core.md](./rules/00-core.md)                                   | 基本動作・言語・コミュニケーションスタイル           |
| [10-tech-stack.md](./rules/10-tech-stack.md)                       | 技術スタックの詳細                                   |
| [15-principles.md](./rules/15-principles.md)                       | 開発原則（ドキュメント哲学・リファクタリング順序）   |
| [16-content-locations.md](./rules/16-content-locations.md)         | コンテンツ/ドキュメントの置き場所ルール（4 分類の判断基準） |
| [17-writing-style.md](./rules/17-writing-style.md)                 | フィードバック由来の表記・言い回し規約（ベタ詰め、CFP 表記、小説・題材の扱い等の SSOT） |
| [20-coding-style.md](./rules/20-coding-style.md)                   | Astro / TypeScript コーディング規約                  |
| [30-architecture.md](./rules/30-architecture.md)                   | ディレクトリ構成と依存関係のルール                   |
| [35-novels.md](./rules/35-novels.md)                               | 自作小説の原稿管理（配置・記法・frontmatter）       |
| [36-storytelling.md](./rules/36-storytelling.md)                   | ストーリー構成フレームワークの起動指針（SSOT は storytelling/） |
| [37-anti-slop.md](./rules/37-anti-slop.md)                         | AI Slop 対策フレームワークの起動指針（SSOT は anti-slop/） |
| [38-coherence.md](./rules/38-coherence.md)                         | 接続度（coherence / cohesion）レビューフレームワークの起動指針（SSOT は coherence/） |
| [40-testing.md](./rules/40-testing.md)                             | テスト方針（現状は手動検証）                         |
| [80-security.md](./rules/80-security.md)                           | シークレット管理と XSS 注意事項                      |
| [90-docs.md](./rules/90-docs.md)                                   | コミットメッセージ規約（Conventional Commits）       |
