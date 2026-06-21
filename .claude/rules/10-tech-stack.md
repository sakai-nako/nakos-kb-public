# Tech Stack

このファイルは、プロジェクトで使用されている技術スタックを定義します。
新しいライブラリを提案する際は、これらの既存スタックとの整合性を考慮してください。

## Core Framework

- **Framework**: [Astro](https://astro.build/) (v5.x)
- **Language**: TypeScript

## Styling

- **CSS**: Standard CSS (Scoped in Astro components)
- **Note**: Tailwind CSSやSassは現在導入されていません。標準のCSS機能（CSS Variables, Nestingなど）を活用してください。

## Task Runner

- **Just**: [Just Programmer's Manual](https://just.systems/man/en/)
- **Note**: 特に理由がない限り、直接package.jsonのスクリプトを直接使わずに、`just`経由でコマンドを実行してください。

## Package Manager

- **Manager**: pnpm (`packageManager: pnpm@10.x` / `pnpm-lock.yaml`)
- **Commands**:
    - Install: `just install`
    - Dev: `just dev` (Astro dev server)
    - Build: `just build` (Astro本体 + Slidesのビルドを一緒に実行)
    - Build (Slides only): `just build-slides`

## Formatting & Linting

- **Tool**: ESLint + Prettier
- **Commands**:
    - Format: `just format`
    - Lint: `just lint`
    - Check (format + lint): `just check`

## Presentation / Slides

- **Tool**: [Slidev](https://sli.dev/)
- **Command**: `just slidev <name>` を使用。`<name>` はデッキディレクトリ名。`draft: true` なデッキも同じコマンドで開ける（サイトには出ない）。
- **Content Location**: `src/content/slides/<name>/index.md` 形式。共有アセット（components, slide-images, global-bottom.vue, vite.config.ts）は `_shared/` 配下に集約し、各デッキへ junction またはコピーで展開（`just setup-slides`）。

## Content Source

- **CMS**: なし（リポジトリ内 Markdown で完結）
- **Collections**: `events` / `cfp` / `presentation_material` / `slides` / `novels` / `novel_chapters` / `about` を Astro Content Collections で読み込み（`slides` / `about` のみ legacy の `type: 'content'`、他は `glob()` loader）。`src/content/blog/` はプレースホルダーで、コレクション定義は未作成。詳細は [30-architecture.md](./30-architecture.md) と [src/content/config.ts](../../src/content/config.ts) を参照。
- **History**: 2026年5月までは [NILTO](https://www.nilto.com/) を Headless CMS として使用していましたが、データ構造がシンプルで個人運用には過剰だったため、ローカル Markdown へ全面移行しました。CMS 復活の必要が出た場合は、`git log` で `src/lib/nilto.ts` の削除コミットを参照してください。
