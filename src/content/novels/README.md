# novels/

自作小説の**原本置き場**であり、Astro サイト（nakos-kb）の **`/novels/` ページの公開ソース**です。ここに溜めた原稿を元に、カクヨム / 小説家になろう / pixiv など各プラットフォームへも投稿していきます。

- Content Collections の `novels`（作品メタ = `<作品 slug>/index.md`）と `novel_chapters`（章 = `NN-*.md`）として [src/content/config.ts](../config.ts) に定義されています。glob パターンに合致しない `_` 始まりの補助ファイル・本 README は公開対象外です。
- ページは `src/pages/novels/`（一覧 → 作品 → 章）、表示ロジックは `src/features/novel/`（ルビ・傍点・場面転換のレンダリングを含む）にあります。
- `main` への push で Cloudflare Pages に**デプロイされます**（`paths-ignore` 対象外）。

AI エージェント（Claude など）向けのルールは [../../../.claude/rules/35-novels.md](../../../.claude/rules/35-novels.md) にあります。本 README が**共通記法とディレクトリ構造の Single Source of Truth** です。

> **この運用ルールは暫定版です。** 最初の作品を書きながら調整します。

---

## ディレクトリ構造

```
novels/
├── README.md              # 本ファイル
├── _shared/               # 任意: 世界観設定・人物シートなどの共通メモ
├── <作品 slug>/
│   ├── index.md           # 作品メタ
│   ├── 01-<章 slug>.md
│   ├── 02-<章 slug>.md
│   └── ...
└── ...
```

### 命名規則

- **作品ディレクトリ**: kebab-case、英数字 + ハイフン（例: `sakura-no-kioku`）。日本語タイトルは `index.md` の `title` で保持。
- **章ファイル**: `NN-<章 slug>.md`（2 桁ゼロ埋め + kebab-case。例: `01-prologue.md`, `12-saikai.md`）。プレフィックスで並び順が確定するので、frontmatter に `order` は持たせません。
- **`_`（アンダースコア）始まり**: 章ではない補助ファイル／ディレクトリに使用。`_shared/` のように。将来の変換スクリプトもこの規則で章以外を除外できます。

---

## frontmatter スキーマ

### 作品 `index.md`

```yaml
---
title: 桜の記憶
slug: sakura-no-kioku
status: ongoing            # ongoing | completed | hiatus
draft: true                # サイトに出さない場合 true（省略時は false）
synopsis: |
  短い作品紹介。数行。
tags: [ファンタジー, 短編連作]
created_at: 2026-04-19
updated_at: 2026-04-19
platforms:                 # 任意。書いておくと作品ページに外部リンクが出る
  kakuyomu:
    url: https://kakuyomu.jp/works/<work_id>
---
```

| フィールド   | 必須 | 内容                                                            |
| :----------- | :--- | :-------------------------------------------------------------- |
| `title`      | ○    | 表示タイトル（日本語 OK）                                       |
| `slug`       | ○    | ディレクトリ名と一致させる                                      |
| `status`     | ○    | 進行状態。`ongoing` / `completed` / `hiatus` のいずれか         |
| `draft`      | -    | `true` ならサイト非公開（一覧・個別ページとも除外）。省略時は `false` |
| `synopsis`   | ○    | あらすじ（複数行可）                                            |
| `tags`       | -    | 任意のタグ配列                                                  |
| `created_at` | ○    | YYYY-MM-DD                                                      |
| `updated_at` | ○    | YYYY-MM-DD（更新のたびに書き換える）                            |
| `platforms`  | -    | 外部プラットフォーム投稿先。現状 `kakuyomu.url` のみ。書くと作品ページにリンクが出る |

### 章ファイル `NN-*.md`

```yaml
---
title: プロローグ
draft: false               # 章単位でサイト非公開にしたい場合 true（省略時は false）
platforms:                 # 任意。書いておくと章ページに外部リンクが出る
  kakuyomu:
    url: https://kakuyomu.jp/works/<work_id>/episodes/<ep_id>
---

　本文…
```

最小限。本文側に意識を集中させたいので、メタは極力持たせません。`draft` は章単位の公開制御、`platforms` は各章のカクヨム等への外部リンク用です。

---

## 共通記法（中間フォーマット）

各プラットフォームへは、共通原稿を**変換スクリプト経由**で投稿する想定（カクヨム向けは `just novel-kakuyomu` で実装済み）。共通原稿はなろう / カクヨム互換記法に寄せます。サイト（`/novels/`）の表示も同じ共通記法を [src/features/novel/utils/renderNovelBody.ts](../../features/novel/utils/renderNovelBody.ts) でレンダリングします。

| 要素     | 記法                        | 備考                                                            |
| :------- | :-------------------------- | :-------------------------------------------------------------- |
| ルビ     | `|漢字《かんじ》`            | なろう・カクヨム両対応。pixiv 向けは `[[rb:漢字 > かんじ]]` に変換。 |
| 傍点     | `《《傍点》》`              | なろう・カクヨム互換。pixiv は削除または別表現にスクリプトで変換。 |
| 改行     | Markdown の通常改行 + 空行 | どのプラットフォームも Enter 改行に変換可能。                   |
| 見出し   | Markdown `#` は**使わない** | 章タイトルは frontmatter の `title` のみ。                      |
| 字下げ   | 段落頭に全角スペース 1 つ   | 手動。                                                          |

### 約束事

- **章タイトルを本文に書かない**: プラットフォームによって「章」の概念が違うため、構造は frontmatter に寄せる。
- **ルビの記号は半角 `|` + 全角 `《》`**: 全角 `｜` との表記揺れを避ける。
- **`#` 見出しは使わない**: 変換後の可搬性のため。

---

## 章末の楽曲情報ブロック（任意）

章が特定の楽曲にインスパイアされている場合、章末に楽曲情報を付記できます。フォーマットは以下で統一します。

```markdown
（本文のラスト）

---

【<ラベル>】

<作曲者>『<曲名>』
<URL>
```

- **区切り**: 本編最終シーンの後に `---`（水平線）を 1 本。
- **ラベル**: `【...】` で囲む。文言は章ごとに変えてよい（例: 「この物語を導いた楽曲」など）。
- **装飾の制約**: Markdown の太字 `**...**` や箇条書き `- ` は投稿先で記号がそのまま残ることがあるため使わない。見出し風にしたい場合は `【】` を使う。
- **楽曲情報**: 各行に `<作曲者>『<曲名>』` と URL をそのまま記載。複数曲を併記する場合は一行空けて続ける。

---

## 投稿フロー

1. `<作品 slug>/NN-*.md` を書く。ルビ等は上記の共通記法で統一。
2. 書き終わったら `updated_at` を当日の日付に更新。
3. `main` に push すると nakos-kb の `/novels/` に自動デプロイされる。
4. カクヨムへは `just novel-kakuyomu <file> | clip` で変換してコピー（[scripts/novel-export-kakuyomu.mjs](../../../scripts/novel-export-kakuyomu.mjs)）。
5. その他のプラットフォームへは、手動で本文をコピーし、必要に応じてプラットフォーム固有記法に手で調整。

---

## 参考: 将来の拡張

今回スコープ外ですが、構造はこれらを見越して決めています。

- **変換スクリプト（カクヨム以外）**: なろう / pixiv 向けの変換を `scripts/novel-export-*.mjs` として追加。
- **投稿先メタ**: frontmatter に `platforms:` を追加して URL・投稿日を管理。
- **記法 lint**: textlint などで全角 `｜` / 半角 `|` 混在を検出。

なお、**サイト公開**（`src/content/novels/` + `src/features/novel/` + `src/pages/novels/`）と**カクヨム変換スクリプト**は実装済み。
