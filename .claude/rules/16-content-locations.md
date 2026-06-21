# Content Locations

リポジトリ内のコンテンツ・ドキュメントをどこに置くかの判断ルールです。「あれどこに置けばいい？」「あれどこにあったっけ？」を予測可能にするための線引きを定義します。

再編成の経緯と将来計画（blog SSoT 化、Zenn junction 等）は [docs/content-restructure.md](../../docs/content-restructure.md) を参照してください。

## 1. 4 つの置き場所

| 場所 | 性質 | デプロイ |
| :--- | :--- | :--- |
| **`src/content/`** | サイトに公開されるコレクション | Cloudflare Pages に公開 |
| **`content-external/`** | サイトには出さないが、外部プラットフォーム（note/Zenn/Qiita/X/Docswell 等）に出す／出したコンテンツ | `paths-ignore` で対象外 |
| **`content-private/`** | 完全 private（外にも出さない自分用） | `paths-ignore` で対象外 |
| **`docs/`** | 運用ドキュメント（playbook, retros 等） | `paths-ignore` で対象外 |

## 2. 判断フロー

新しいファイルを置く場所に迷ったら、上から順に：

1. **サイトに公開する？** → `src/content/<collection>/`
    - 既存 collection: `events`, `cfp`, `slides`, `novels`, `presentation_material`, `about`, `blog`（blog はプレースホルダー）
2. **外部プラットフォームに出す（or 既に出した）？** → `content-external/<media>/`
    - 既存: `articles/`, `community/`, `sns/`, `assets/`, `cv/`
    - 「外」= note・Zenn・Qiita・dev.to・X・Docswell・登壇先など、自サイト以外
3. **完全に private（自分用、外に出さない）？** → `content-private/<topic>/`
    - 既存: `about-sakai-nako/`（自己分析）, `scratch/`（雑メモ）, `other/`（その他 private 資料）
4. **運用ドキュメント（playbook 等の内部資料）？** → `docs/<topic>/`
    - 既存: `cfp/`（CfP playbook）, `learnings/`（playbook + retros）, `content-restructure.md`（4 分類整理の追跡）

軸の交差例:

- 「サイトには出さないけど外部に note へ出す」→ `content-external/`
- 「公開しない自己分析メモ」→ `content-private/`
- 「CfP 応募の勝ちパターン playbook」→ `docs/`

## 3. 媒体ごとの draft 運用

「サイトに出す/出さない」は `src/content/` 配下のコレクションでは frontmatter `draft: true | false` に一律で集約しています（Phase 3 で整理済み）。`status` は「進行状態」だけを表す独立フィールドです（応募ステータスや連載状態など）。

例外として `cfp` だけは専用ページがなく events 詳細から逆引きされるだけのため、`draft` を持たず「`status` 有 = 応募済み = 表示」「`status` 無 = 応募前 = 非表示」というルールにしています（Phase 3.6 で簡略化）。

| 媒体 | サイト非公開の表現 | 進行状態の表現 | 完成後の置き場所 |
| :--- | :--- | :--- | :--- |
| `blog` | `draft: true` | なし | 最初から `src/content/blog/` |
| `novels` | `draft: true` | `status: ongoing / completed / hiatus` | 最初から `src/content/novels/` |
| `cfp` | `status` なし（応募前） | `status: submitted / accepted / rejected / withdrawn`（応募後のみ） | 最初から `src/content/cfp/<slug>/` |
| `slides` | `draft: true` | なし | 最初から `src/content/slides/<slug>/`。`draft: true` のまま開発し、公開時に `draft: false` に切り替え |
| `articles` | 置き場所で表現（`content-external/articles/` 自体が非公開） | なし | サイトには出さない（外部投稿が本番） |

`events` / `presentation_material` / `about` は常に公開前提のため `draft` フィールドを持ちません。

**将来**: blog SSoT 化（`src/content/blog/` に書いて Zenn/note/Qiita/dev.to に変換出力する）が進めば、`articles/` の役割は段階的に縮小します。詳細は [docs/content-restructure.md](../../docs/content-restructure.md) の Phase 4~5。

## 4. `_` 始まりの補助ファイル

Astro Content Collections の glob loader は `_` 始まりを自動除外しない（パターン次第）。意図的に**除外したい補助ファイル**は、所属コレクションの glob パターンと噛み合うように `_` プレフィックスを使ってください。

- `novels` (`*/index.md`, `*/[0-9][0-9]-*.md`): `_plot/`, `_neta.md` 等は対象外
- `cfp` (`*/index.md`): `<slug>/_memo.md` 等は対象外
- `slides` (`type: 'content'`): `_data/`, `_event-log.md` 等は対象外（先頭 `_` が glob に弾かれる）

draft 期に「いったん残しておきたいけど公開はしたくない」ファイルはこの規約で置けます。

## 5. ディレクトリ移動時の注意

- ディレクトリ移動でハードコードされたパス（`justfile`, `scripts/*.mjs`, `.gitignore`, `.github/workflows/deploy.yml`, ドキュメント中のリンク）の更新が必要
- `src/content/slides/` 配下の `_shared/` 系 junction は `just setup-slides` で再生成
- 移動後は `pnpm astro sync` で Content Collection の型エラーが出ないか確認
