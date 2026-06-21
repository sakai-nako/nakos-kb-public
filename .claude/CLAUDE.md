# nakos-kb

## 全般

- ユーザーへの応答・説明はすべて **日本語** で行ってください（韓国語や英語は使わない）。
- 詳細な規約は [.claude/rules/](./rules/) 配下にあります。本ファイルはオーバービューと索引です。
- ユーザー（GitHub アカウント `sakai-nako`）自身のリポジトリ情報を参照する際は、`gh` コマンド（`gh repo view`, `gh pr list`, `gh issue view` など）を使用してください。Web 検索や URL 推測ではなく `gh` 経由で確実に取得します。
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
| **Deploy**         | Cloudflare Pages（[.github/workflows/deploy.yml](../.github/workflows/deploy.yml)） |

詳細は [rules/10-tech-stack.md](./rules/10-tech-stack.md) を参照してください。

## ディレクトリ構成

```
nakos-kb/
├── .claude/
│   ├── CLAUDE.md              # 本ファイル（AI エージェント向けオーバービュー）
│   ├── rules/                 # 詳細ルール（番号体系は README.md 参照）
│   ├── storytelling/          # ストーリー構成フレームワーク（SSOT。ブログ/スライド/小説横断）
│   ├── skills/                # Skill（story-structure, novel-revision 等）
│   └── agents/                # SubAgent（blog/slide/novel-architect）
├── .github/workflows/
│   └── deploy.yml             # Cloudflare Pages デプロイ
├── public/                    # 静的アセット（そのまま配信）
├── scripts/
│   ├── build-slides.mjs       # Slidev 一括ビルド
│   ├── setup-slides.mjs       # 各デッキへ _shared/ の junction とコピーを冪等に展開
│   ├── novel-export-kakuyomu.mjs  # 小説章 → カクヨム形式変換
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
├── content-external/          # デプロイ対象外（paths-ignore）。サイトに出さないが外部プラットフォームに出すコンテンツ
│   ├── articles/              # ── 記事・エッセイの下書き（note 等が本番）
│   ├── community/             # ── コミュニティ運営関連のコンテンツ（運営blog記事等）
│   ├── sns/                   # ── SNS 投稿の下書き・アーカイブ
│   ├── assets/                # ── 下書きで使う画像等
│   └── cv/                    # ── 履歴書・職務経歴書（Typst。外部提出物）
├── content-private/           # デプロイ対象外（paths-ignore）。完全 private（外にも出さない）
│   ├── about-sakai-nako/      # ── 自己分析メモ（self-portrait 元データ + swot）
│   ├── other/                 # ── その他 private 資料
│   └── scratch/               # ── 雑メモ（_scratchpad, idea, sns-and-self-introduction）
├── docs/                      # デプロイ対象外（paths-ignore）。運用ドキュメント
│   ├── content-restructure.md # ── コンテンツ再編成（4 分類）の追跡ドキュメント
│   ├── cfp/                   # ── CfP playbook（応募の勝ちパターン等）
│   └── learnings/             # ── 学び・振り返りの蓄積（playbook.md, retros/）
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
| `cfp`                  | [src/content/cfp/](../src/content/cfp/)                              | CfP 応募（採択／不採択も残す）                            |
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
| `just format`       | Prettier で整形                                        |
| `just lint`         | ESLint のみ実行                                        |
| `just slidev <name>`| 単一デッキを Slidev 開発サーバーで開く（`<name>` は [src/content/slides/](../src/content/slides/) 配下のディレクトリ名。`draft: true` なデッキも同じコマンドで開ける） |
| `just setup-slides` | 各デッキディレクトリに `_shared/` への junction とコピーを冪等に展開。`_shared/global-bottom.vue` などを編集したら再実行 |
| `just novel-kakuyomu <file>` | 小説の章をカクヨム形式に変換して stdout へ（`\| clip` でクリップボードにコピー） |
| `just blog-to-zenn <slug>` | blog 記事を Zenn 形式に変換して stdout へ（emoji / type は `platforms.zenn` または既定値、本文冒頭に canonical 注記を自動挿入） |
| `just cv` / `just cv-watch <name>` | 履歴書・職務経歴書 PDF を Typst でビルド（出力先: `content-external/cv/out/`） |
| `just sim-video <deck>` | デッキのリハーサル動画を生成（VOICEVOX + Slidev + ffmpeg）。`draft: true` のデッキでも回せる |

## デプロイ

[.github/workflows/deploy.yml](../.github/workflows/deploy.yml) が Cloudflare Pages へのデプロイを担当します。トリガーは **`main` への push** のみ（Web サイトに影響しないファイル — `.claude/`, `.vscode/`, `.github/`, `content-external/`, `content-private/`, `docs/`, README など — は `paths-ignore` で除外）。

スライド差分がない push では Slidev ビルドをスキップする最適化も入っています。

## 環境変数

現時点で必須の環境変数はありません（CMS 連携の `NILTO_API_KEY` 等は2026年5月の移行で撤去済み）。秘密情報の扱いは [rules/80-security.md](./rules/80-security.md) を必ず確認してください。

## ストーリー構成フレームワーク

ブログ・発表資料・小説に共通する「ストーリー構成」の設計フレームワークを [.claude/storytelling/](./storytelling/) に集約しています（物語論ベースの SSOT）。構成づくり・レビューの依頼が来たら [story-structure Skill](./skills/story-structure/SKILL.md)、ゼロからのドラフト生成や自律レビューは媒体別 SubAgent（[blog](./agents/blog-architect.md) / [slide](./agents/slide-architect.md) / [novel](./agents/novel-architect.md)-architect）。起動指針は [rules/36-storytelling.md](./rules/36-storytelling.md)。

## `.claude/rules/` 索引

ルールファイルは番号順に読み込み優先度が上がります（番号体系の詳細は [README.md](../README.md) を参照）。

| ファイル                                                           | 内容                                                 |
| :----------------------------------------------------------------- | :--------------------------------------------------- |
| [00-core.md](./rules/00-core.md)                                   | 基本動作・言語・コミュニケーションスタイル           |
| [10-tech-stack.md](./rules/10-tech-stack.md)                       | 技術スタックの詳細                                   |
| [15-principles.md](./rules/15-principles.md)                       | 開発原則（ドキュメント哲学・リファクタリング順序）   |
| [16-content-locations.md](./rules/16-content-locations.md)         | コンテンツ/ドキュメントの置き場所ルール（4 分類の判断基準） |
| [20-coding-style.md](./rules/20-coding-style.md)                   | Astro / TypeScript コーディング規約                  |
| [30-architecture.md](./rules/30-architecture.md)                   | ディレクトリ構成と依存関係のルール                   |
| [35-novels.md](./rules/35-novels.md)                               | 自作小説の原稿管理（配置・記法・frontmatter）       |
| [36-storytelling.md](./rules/36-storytelling.md)                   | ストーリー構成フレームワークの起動指針（SSOT は storytelling/） |
| [40-testing.md](./rules/40-testing.md)                             | テスト方針（現状は手動検証）                         |
| [80-security.md](./rules/80-security.md)                           | シークレット管理と XSS 注意事項                      |
| [90-docs.md](./rules/90-docs.md)                                   | コミットメッセージ規約（Conventional Commits）       |
