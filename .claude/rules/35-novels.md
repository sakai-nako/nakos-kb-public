# Novels

自作小説の原稿管理に関するルールです。詳細な運用・記法の **Single Source of Truth** は [../../src/content/novels/README.md](../../src/content/novels/README.md) を参照してください。本ファイルは AI エージェント向けの振る舞い指針です。

## 1. 配置ルール

- 小説の原稿は必ず **`src/content/novels/`** 配下に置いてください。Astro サイトの `/novels/` ページとして公開されます。
- Content Collection は `novels`（作品メタ = `*/index.md`）と `novel_chapters`（章 = `*/NN-*.md`）の 2 つ。glob パターンに合致しない `_` 始まりの補助ファイル（`_plot/`, `_neta.md` など）と README は公開対象外なので、執筆メモは従来どおり作品ディレクトリ内に `_` 始まりで置けます。
- サイト表示の実装は `src/features/novel/`（共通記法のレンダラー含む）と `src/pages/novels/`。

## 2. ディレクトリ構造

- 1 作品 = 1 ディレクトリ（作品 slug は kebab-case）。
- 章ファイルは `NN-<章 slug>.md`（2 桁ゼロ埋め）。並び順はファイル名プレフィックスで決まります。
- 作品メタは `<作品 slug>/index.md`。
- `_` 始まり（例: `_shared/`）は章ではない補助ファイル／ディレクトリ。

詳しくは [../../src/content/novels/README.md](../../src/content/novels/README.md) のディレクトリ構造セクションを参照。

## 3. frontmatter スキーマ

最小スキーマのみ使用します（詳細は novels/README.md）。

- 作品 `index.md`: `title`, `slug`, `status` (`ongoing` / `completed` / `hiatus`), `draft` (省略時 `false`), `synopsis`, `tags`, `created_at`, `updated_at`, `platforms?` (任意)
- 章ファイル: `title`, `draft` (省略時 `false`), `platforms?` (任意)

`platforms` は外部プラットフォームへの投稿先 URL を持たせるための名前空間です。書いておくと、作品ページ・章ページに「📖 カクヨムで読む ↗」のような外部リンクが自動表示されます。

```yaml
platforms:
  kakuyomu:
    url: https://kakuyomu.jp/works/<work_id>            # 作品メタ
    # url: https://kakuyomu.jp/works/<work_id>/episodes/<ep_id>  # 章ファイル
```

現状サポート: `kakuyomu` のみ。なろう / pixiv 等を追加する場合は `platforms.narou.url` のように同階層に並べる予定（schema 拡張時に検討）。

## 4. 共通記法

- ルビ: `|漢字《かんじ》`（半角 `|` + 全角 `《》`）
- 傍点: `《《傍点》》`
- 見出し（`#`）は本文で使わない — 章タイトルは frontmatter の `title` に書く
- 段落頭は全角スペース 1 つで字下げ

執筆補助やリライトを依頼されたら**この記法で出力**してください。プラットフォーム固有記法（pixiv の `[[rb:...]]` など）を直接書かないこと。

## 5. AI エージェントの振る舞い

- 章の執筆・リライト補助時は、上記の共通記法で出力してください。
- 作品メタを更新したら `updated_at` も更新してください。
- 変換スクリプトやサイトのレンダラー（[renderNovelBody.ts](../../src/features/novel/utils/renderNovelBody.ts)）が壊れそうな変更（記法の揺れ、命名規則破り、`#` 見出し追加など）を提案しないでください。
- ルビ記号の全角 `｜` / 半角 `|` 混在を見つけたら指摘してください。
- `src/content/novels/` への push は Cloudflare Pages への**公開デプロイを伴う**ことを意識してください（`paths-ignore` 対象外）。

## 6. 関連スキル・フレームワーク

- **[novel-revision](../skills/novel-revision/SKILL.md)** — 章の**推敲（文章レベル）**を対話的に進めるワークフロー。「推敲したい」「読み返したい」「だいたいできた」のような完成期の合図で起動。観点別の通し読み（モチーフ／方言・セリフ／心情描写）→ 表記揺れ・繰り返し語・視点などの細部チェック、を 2-3 個ずつの論点でユーザーに選ばせながら回す。
- **[story-structure](../skills/story-structure/SKILL.md)** — **構成（プロット・章立て・伏線・視点設計）**を対話的に組み立てる／レビューするワークフロー。小説の構成の考え方は [storytelling/30-novel.md](../storytelling/30-novel.md)、ゼロからのプロット生成や原稿の構成診断は SubAgent [novel-architect](../agents/novel-architect.md) に委任できる。
- 切り分け: **構成（流れ・組み立て）= story-structure / novel-architect**、**文章の磨き込み = novel-revision**。記法・配置ルール（本ファイル）はどちらも変更しない。

## 7. スコープ外（今回やらないこと）

以下は明示的な依頼があるまで**提案しない**でください:

- カクヨム以外のプラットフォーム（なろう / pixiv 等）の `platforms` 拡張・変換スクリプト追加（カクヨム向けは `just novel-kakuyomu` と表示用 `platforms.kakuyomu.url` が実装済み）
- 小説向け lint の追加

（Astro サイト本体への公開は 2026-06 に実装済みのため、このリストから外れました。）
