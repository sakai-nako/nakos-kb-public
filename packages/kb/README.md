# Nako's Knowledge Base

life の公開準備が完了した allowlisted projection を静的に表示する Astro 7 site。公開投影に含まれる作品だけを build する。実データの取得・import はしない。

## About public snapshot

`/` は `/about` に移動し、公開済みの About は `/about` と `/about/<slug>` を維持する。About は承認済み public mirror の commit `6d2a21b865fc126093dd0fee10293ea87c1b5423` から、frontmatter・body・ファイル digest を照合して 3 件だけを byte-exact に移植した snapshot である。合成 snapshot fixture の検証テストは digest、draft 除外、安全な path、script / `javascript:` 禁止を確認する。private `nakos-kb`、life API / DB は読まない。

Markdown は Astro のテキスト node と allowlisted HTTP(S) link だけで描画する。raw HTML は実行せず、外部 link には `noopener noreferrer` を付ける。

見た目は DS の `tokens.css` と `patterns.css` (静的サイト向けの CSS 層) を読み込む。kb は Lit 部品を置かず、ヘッダー・カード・読み物パネルは `nk-*` のクラスを付けたプレーン HTML で書く。`src/styles/global.css` に残すのは kb 固有の指定で、ページの地色、小説と About の本文組み、章立て、章移動を持つ。テーマ切替は native button のままで、JS を切っても本文と導線は読める。存在しない URL は `src/pages/404.astro` が同じヘッダー付きで受け、build は `dist/404.html` を出す。
`public/` は Astro が `dist/` へそのままコピーする。favicon は `public/favicon.svg` (旧サイトと
同じ図案) で、`Base.astro` の `<link rel="icon">` が指す。

`deno task --cwd brands/personal/packages/kb import-projection <bundle.json>` は人間の diff review 後にだけ使う。schema/revision/slug/章順/本文規則を検証し、対象作品だけを atomic に置換する。本文はログに出さず、公開やネットワーク fetch を自動化しない。

importer は作品 index と章を `---` で囲んだ一行の canonical JSON frontmatter と本文で保存する。文字列の改行・引用符・バックスラッシュを JSON escaping のまま保存し、本文へ title や source metadata を混ぜない。読み取り側もこの形式だけを厳格に受理する。

## Events

`/events` と `/events/<id>` は `src/content/events/<id>.md` (1 行 canonical JSON frontmatter、本文なし) を読む。
原稿は `vault/events/`、投影は `just repo-vault-events-export` → `just personal kb projection-review` → `projection-apply`。
台帳の key は `events` (種別で 1 entry)。発表資料は各イベントの `materials` に入り、外部リンクとして描画する。

## CFP

`/cfp/<slug>` と `/cfp/<slug>/drafts` は `src/content/cfp/<slug>/index.md` と `drafts.md`
(1 行 canonical JSON frontmatter + Markdown 本文) を読む。一覧ページは旧サイトにもないので作らない。
イベント詳細は `event` で紐づく CfP を逆引きして並べる。
原稿は `vault/cfp/`、投影は `just repo-vault-cfp-export` → `just personal kb projection-review` →
`projection-apply`。台帳の key は `cfp` (種別で 1 entry)。

## Blog

`/blog` と `/blog/<slug>` は `src/content/blog/<slug>.md` (1 行 canonical JSON frontmatter +
Markdown 本文) を読む。一覧は `pubDate` の降順、同じ日付は ID の降順に並べる。日付は
`YYYY/MM/DD` で表示し、`Date` を挟まず文字列のまま整形するので実行環境の時差で日がずれない。
原稿は `vault/blog/`、投影は `just repo-vault-blog-export` → `just personal kb projection-review` →
`projection-apply`。台帳の key は `blog` (種別で 1 entry)。旧 Zenn 変換用の `platforms` は
原稿だけが持ち、投影には出さない。

## Slides

`/slides` は `src/content/slides/<slug>/meta.json` (canonical JSON) だけを読み、`eventDate` の降順、
同じ日付は ID の降順に並べる。デッキ本体は Slidev が作る別のサイトなので、一覧とイベント詳細からは
`target="_blank"` のリンクで `/slides/<slug>/` へ送る。loader は `index.md` の Slidev frontmatter を
読まない。原稿は `vault/slides/`、投影は `just repo-vault-slides-export` → `just personal kb projection-review`
→ `projection-apply`。台帳の key は `slides` (種別で 1 entry)。`meta.json` の `event` が指すイベントの
詳細ページに「スライド」の節が出る。

`deno task build` は `astro build` のあとに `scripts/build-slides.mjs` を回す。投影された各デッキを
`@slidev/cli` で `dist/slides/<slug>/` へ build し、デッキ直下のユーザー資産 (`images/` など) を出力へ
コピーし、共有画像を `dist/slide-images/` へ置き、デッキごとの SPA routing を `dist/_redirects` に
まとめる。Slidev は Deno の npm 互換で動くので、CI の image は `denoland/deno` のままでよい。投影が
無ければ何もしない。

共有部品 (`components/`、`slide-images/`、`global-bottom.vue`、`vite.config.ts`) の置き場は
`slides/_shared/` だけで、ビルドが各デッキへ junction とコピーで配る。配布物は Git 除外なので、
投影ディレクトリに残っていてもコミットに入らない。

`public/_redirects` は Cloudflare Pages 用の規則を持つ。`/` から `/about` への 301 と、
`/slides/*` の受けの 2 行。`build-slides.mjs` はデッキごとの規則をこの 2 行より前に差し込む。
Cloudflare は上から順に見て最初に一致した規則を使うため、一般規則が先にあるとデッキの深い path
が index.html へ届かない。

ローカル配備の static-web-server は `_redirects` を読まない。`/slides/<slug>/` の 1 枚目は開くが、
`/slides/<slug>/3` のような深い path は 404 になる。配信を Cloudflare Pages へ切り替えると解消する。

## Markdown 描画

CFP と Blog の本文は `src/shared/markdown.ts` (marked) で HTML にしてから `set:html` で描画する。
描画の制約は次の 5 つで、投影の中身に関わらず守る。

- raw HTML は実行せず、文字列として出す。
- HTML コメントだけは文字列にせず落とす。原稿が持つ `check-content: ignore` の免除マークが読者に見えていた。トークン全体が 1 つのコメントのときだけ対象にし、コメント以外を含む raw HTML は従来どおり文字列にする。
- リンクは http(s) とサイト内の絶対パスだけを `<a>` にし、それ以外 (`javascript:` 等) はテキストに落とす。外部リンクには `target="_blank" rel="noopener noreferrer"` を付ける。
- 画像は描画せず alt テキストだけを出す。
- 見出しには旧サイトと同じ id (rehype-slug 相当) と `#` のアンカーを付ける。id が重複したら `-1` から連番を足す。

## Projection review と apply

公開更新は bundle を直接 import せず、明示的な二段階で行う。KB はどちらの段階でも life API / DB へ接続せず、ローカルの bundle file だけを入力にする。

1. `just personal kb projection-review <bundle.json>` は公開中の source を変更せず、gitignore 済みの `.projection-review/` に candidate Markdown と receipt を生成する。candidate の差分を人間が確認する。
2. 承認後に `just personal kb projection-apply <bundle.json> <receipt.json>` を実行する。apply は bundle revision、candidate のファイル・内容 digest、review 時点の公開 target digest を再検証し、対象作品だけを原子的に置換する。変更がなければ no-op として receipt を片付ける。

review と apply の間に bundle、candidate、または公開 target が変われば apply は拒否する。review artifact は成功時に消え、不要になった review は明示的に `.projection-review/` から削除する。これらのコマンドは commit、deploy、network fetch を行わない。

## Publication authority

`publication-authority.json` は公開本文の外にある供給元台帳で、初期状態は空である。登録済みの作品は source 付き bundle v2 だけを受け入れ、kind / work_id / generation が active entry と一致しなければ import、review、apply の全入口で拒否する。未登録の作品だけは、移行中の bundle v1 を暫定受理する。

台帳は手編集せず、実作品の切替を人が明示的に決めたときだけ次のコマンドを使う。`register` は新しい作品だけを登録し、`activate` は供給元を切り替えるたびに generation を更新する。`freeze` はその作品の候補を停止する。

```sh
just personal kb authority-register <slug> <work-id> vault
just personal kb authority-freeze <slug>
just personal kb authority-activate <slug> db
```

review receipt には台帳全体の revision も記録する。review 後に台帳が変わった場合は、内容が同じでも再 review が必要になる。操作中は台帳横の短時間 lock で直列化する。残った lock は実行中の操作がないことを確認してから人が除去する。

## Public URL contract

小説と章の canonical URL は `src/shared/public-paths.ts` の manifest を通して生成し、内部リンクも同じ path を使う。manifest は importer が置換する projection content の外にあるため、次回 import で historic alias を失わない。現在の作品・章 path は canonical のまま維持し、新規章は bundle slug を既定にする。

小説の章 URL は旧サイトの `/novels/cadenza-engineering/01-not-on-the-symbols` の形を保つ。
投影の bundle slug (`cadenza-engineering-01-not-on-the-symbols`) を manifest で 3 章分 alias する。

旧公開サイトの `/` から `/about` への導線と About 3 件はこの snapshot で復元した。Events 29 件、CFP 5 件、Blog 1 件、Slides 2 件は 2026-09 に旧サイトと同じ ID で移した。残るのは配信経路の切替 (GitHub ミラー経由の Cloudflare Pages) で、このローカル deployment は旧サイトの偽ページや redirect を作らない。

Astro 7.2.2 は 2026-08-18 に `pnpm view astro@7 version` で確認した現行 patch。公式の [upgrade documentation](https://docs.astro.build/en/upgrade-astro/) と v7 guide に従う。

## 検証と配備

入口は `just personal kb test` / `build` / `e2e` / `ship`。
検証用 build は `scripts/ci.ts kb-build` が全 6 種別の入力を `tests/fixtures/` に固定する。
ローカルで `just personal kb build` を検証に使う場合も、全 `KB_*_CONTENT_ROOT` と小説用の
`KB_CONTENT_ROOT` を対応する fixture へ指定する。公開イメージは CI で既存の公開用データから作る。

`just personal kb smoke <URL>` は指定先の `/` に HEAD を送り、HTTP 200 と HTML の Content-Type を確認する。
本文の取得や書き込みは行わず、cleanup 対象は 0 件。描画は合成データの Playwright E2E で確認する。
配備 ID と registry は `kb` のまま。公開ミラーへの push は利用者が別途実行する。
