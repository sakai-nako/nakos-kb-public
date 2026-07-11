# Content Locations

リポジトリ内のコンテンツ・ドキュメントをどこに置くかの判断ルールです。「あれどこに置けばいい？」「あれどこにあったっけ？」を予測可能にするための線引きを定義します。

再編成の経緯と将来計画（blog SSoT 化、Zenn junction 等）は [docs/content-restructure.md](../../docs/content-restructure.md) を参照してください。

## 1. 4 つの置き場所

| 場所 | 性質 | デプロイ |
| :--- | :--- | :--- |
| **`src/content/`** | サイトに公開されるコレクション | Cloudflare Pages に公開（公開ミラー経由。`/publish-public-mirror` がトリガー） |
| **`content-external/`** | サイトには出さないが、外部プラットフォーム（note/Zenn/Qiita/X/Docswell 等）に出す／出したコンテンツ | ミラー・デプロイ対象外（public-mirror-rules で除外） |
| **`content-private/`** | 完全 private（外にも出さない自分用） | ミラー・デプロイ対象外（public-mirror-rules で除外） |
| **`docs/`** | 運用ドキュメント（playbook, retros 等） | ミラー・デプロイ対象外（public-mirror-rules で除外） |

## 2. 判断フロー

新しいファイルを置く場所に迷ったら、上から順に：

1. **サイトに公開する？** → `src/content/<collection>/`
    - 既存 collection: `events`, `cfp`, `slides`, `novels`, `presentation_material`, `about`, `blog`（blog はプレースホルダー）
2. **外部プラットフォームに出す（or 既に出した）？** → `content-external/<media>/`
    - 既存: `articles/`, `community/`, `sns/`, `assets/`, `cv/`
    - 「外」= note・Zenn・Qiita・dev.to・X・Docswell・登壇先など、自サイト以外
3. **完全に private（自分用、外に出さない）？** → `content-private/<topic>/`
    - 既存: `about-sakai-nako/`（自己分析）, `clippings/`（外部記事×自分の関連の蓄積。取り込みは clip Skill）, `scratch/`（雑メモ）, `other/`（その他 private 資料）
4. **運用ドキュメント（playbook 等の内部資料）？** → `docs/<topic>/`
    - 既存: `cfp/`（CfP playbook）, `learnings/`（playbook + retros）, `content-restructure.md`（4 分類整理の追跡）

軸の交差例:

- 「サイトには出さないけど外部に note へ出す」→ `content-external/`
- 「公開しない自己分析メモ」→ `content-private/`
- 「CfP 応募の勝ちパターン playbook」→ `docs/`

## 3. 媒体ごとの draft 運用

「サイトに出す/出さない」は `src/content/` 配下のコレクションでは frontmatter `draft: true | false` に一律で集約しています（Phase 3 で整理済み）。`status` は「進行状態」だけを表す独立フィールドです（応募ステータスや連載状態など）。

`cfp` は他 collection と異なり、**公開制御を 2 つの軸で行います**（2026-06 に専用ページ実装時に整理）:
- **`/cfp/<slug>` 専用ページの生成**: `draft` フィールド（デフォルト false）。完全に下書きで隠したい場合のみ `draft: true`
- **`/events/<id>` ページの CFP セクション表示**: `status` の有無（応募前は events からは見えないが、`/cfp/<slug>` 直アクセスでは `draft: false` なら見える）

| 媒体 | サイト非公開の表現 | 進行状態の表現 | 完成後の置き場所 |
| :--- | :--- | :--- | :--- |
| `blog` | `draft: true` | なし | 最初から `src/content/blog/` |
| `novels` | `draft: true` | `status: ongoing / completed / hiatus` | 最初から `src/content/novels/` |
| `cfp` | `draft: true`（個別非公開） | `status: submitted / accepted / rejected / withdrawn`（応募後のみ。events 表示制御に使われる） | 最初から `src/content/cfp/<slug>/` |
| `cfp_drafts` | `cfp` の `draft` に追従（同 slug の cfp が draft なら校正過程ページも非生成） | なし | `src/content/cfp/<slug>/drafts.md` |
| `slides` | `draft: true` | なし | 最初から `src/content/slides/<slug>/`。`draft: true` のまま開発し、公開時に `draft: false` に切り替え |
| `articles` | 置き場所で表現（`content-external/articles/` 自体が非公開） | なし | サイトには出さない（外部投稿が本番） |

`events` / `presentation_material` / `about` は常に公開前提のため `draft` フィールドを持ちません。

**将来**: blog SSoT 化（`src/content/blog/` に書いて Zenn/note/Qiita/dev.to に変換出力する）が進めば、`articles/` の役割は段階的に縮小します。詳細は [docs/content-restructure.md](../../docs/content-restructure.md) の Phase 4~5。

## 4. サイトに出るコンテンツの日付方針

サイトに出るコンテンツ本文（`src/content/<collection>/` 配下、特に `cfp_drafts/drafts.md` のような校正過程ドキュメント）には、**作業日付（編集日時・レビュー実施日・メモを書いた日など）を載せない**。関連: [17-writing-style.md](./17-writing-style.md) §3。

| 種類 | 書いてよいか |
| :--- | :--- |
| イベント開催日・公開日・発表日・応募日 等の**コンテンツとしての日付** | ◯ |
| frontmatter のメタ日付（`pubDate`、`created_at`、`updated_at`、`presented_at` 等） | ◯ |
| 本文中の事実としての日付（例: 「2026年5月の移行で…」） | ◯ |
| 見出しや本文中の**編集日付**（例: `### Round 1 改善ログ (2026-06-27)`） | ✕ |
| メモを書いた日付・更新ログの日付 | ✕ |

「いつ」が必要な場合は `git log` で追える（コミット日時が真の編集日）。コンテンツ本文に重ねて書かない。

**対象外（書いてよい場所）:** サイト非公開のメモ（`_memo.md`、`content-private/`、`docs/`、`.claude/` 配下）、コミットメッセージ・PR 説明。

## 5. `_` 始まりの補助ファイル

Astro Content Collections の glob loader は `_` 始まりを自動除外しない（パターン次第）。意図的に**除外したい補助ファイル**は、所属コレクションの glob パターンと噛み合うように `_` プレフィックスを使ってください。

- `novels` (`*/index.md`, `*/[0-9][0-9]-*.md`): `_plot/`, `_neta.md` 等は対象外
- `cfp` (`*/index.md`) / `cfp_drafts` (`*/drafts.md`): `<slug>/_memo.md` 等の `_` 始まりは対象外
- `slides` (`type: 'content'`): `_data/`, `_event-log.md` 等は対象外（先頭 `_` が glob に弾かれる）

draft 期に「いったん残しておきたいけど公開はしたくない」ファイルはこの規約で置けます。

## 6. ディレクトリ移動時の注意

- ディレクトリ移動でハードコードされたパス（`justfile`, `scripts/*.mjs`, `.gitignore`, `scripts/public-mirror-rules.psd1` の除外パス, ドキュメント中のリンク）の更新が必要
- `src/content/slides/` 配下の `_shared/` 系 junction は `just setup-slides` で再生成
- 移動後は `pnpm astro sync` で Content Collection の型エラーが出ないか確認
