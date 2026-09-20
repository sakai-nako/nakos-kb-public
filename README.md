# nakos-kb-public

> [!NOTE]
> このリポジトリは personal-monorepo の**フィルタ済み公開ミラー**です (生成元コミット: `6f2a20cd`)。
> `packages/kb` と、そのビルドに要る範囲だけを `just repo-mirror-publish kb` で随時 push しています。
> Web サイト (Cloudflare Pages) はこのミラーへの push をトリガーに GitHub Actions でデプロイされます。
> private 側に実コミット履歴があるため、このミラーには履歴は含まれません。

hack-pleasantness.com の公開ソースです。非公開の monorepo から、公開に必要な範囲 (`packages/kb` と
デザインシステムのトークン) をフィルタしたスナップショットを、人が明示的に push しています。
このリポジトリでは Issue と Pull Request を受け付けていません。

## ビルド

Deno 2.9 以上で次を実行します。

```sh
deno install
cd packages/kb && deno task build   # Astro のサイトと Slidev のデッキを dist/ に出力
```

配信は GitHub Actions が `main` への push で `packages/kb/dist` を Cloudflare Pages に upload します。

`deno.lock` は含めていません。monorepo 側の lock は workspace 全体のもので、このミラーの workspace
とは構成が違うためです。`deno install` は凍結なしで走るので、依存の版はこのリポジトリだけでは
固定されません。ミラー専用の lock を持たせるかは未定です。
