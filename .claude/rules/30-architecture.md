# Architecture

Astroプロジェクトのディレクトリ構造と設計指針に関するルールです。
Feature-based Architectureを採用し、機能ごとの凝集度を高める構成としています。

## Directory Structure

### `src/features/`

- **役割**: 機能ごとのロジックとUIコンポーネント。
- **構成**: 機能名（例: `event`, `novel`, `navigation`）でディレクトリを分け、その中に `components`, `utils`, `hooks` などを配置します。
- **ルール**:
    - `pages` や `layouts` をインポートしてはいけません（循環依存の防止）。
    - 他の `features` への依存は避けてください。共通ロジックが必要な場合は `src/shared`（または `features/core`）への切り出しを検討してください。

### `src/layouts/`

- **役割**: ページ共通の枠組み（HTMLヘッダー、メタタグ、大枠のグリッドなど）。
- **ルール**:
    - 特定の機能（Feature）に強く依存するロジックは含めないでください。あくまで「枠（Slots）」を提供します。
    - `Header` や `Footer` のような全ページ共通コンポーネントの使用は許可されます。

### `src/pages/`

- **役割**: Astroのファイルベースルーティング、データフェッチ、ページの組み立て。
- **ルール**:
    - **Thin Wrapper**: ここにUI定義や複雑なロジックを書かないでください。
    - 主に `src/content` からデータを取得し、`src/layouts` と `src/features` のコンポーネントを組み合わせてページを構成します。

### `src/content/`

- **役割**: コンテンツデータ（Markdown, MDX, YAMLなど）とContent Collections定義（`config.ts`）。
- **ルール**:
    - 記事データやスライド原稿などはここに集約します。
    - AstroのContent Collections APIを使用して型安全にアクセスしてください。
    - 新規 collection は `glob()` loader を使ってください（`type: 'content'` は v5 で deprecated）。
- **リレーション**: `events` を hub とした片方向参照。`cfp` / `presentation_material` / `slides` が frontmatter で `event: <event-slug>` を持ち、Astro の `reference('events')` で型安全に結合します。逆引きは `getCollection('cfp', e => e.data.event?.id === eventId)` のパターン。
- **novels の親子対応**: `novels`（作品メタ）と `novel_chapters`（章）は frontmatter 参照ではなく、章エントリ id のディレクトリ部分（`<作品 slug>/NN-…`）で対応付けます（章ファイルの frontmatter を `title` のみに保つ規約のため）。導出ロジックは [src/features/novel/utils/chapters.ts](../../src/features/novel/utils/chapters.ts)。

### `src/assets/`

- **役割**: グローバルな静的アセット（画像、フォントなど）。

### `src/lib/`

- **役割**: 複数の機能で共有される汎用ユーティリティ、外部サービスとの連携ロジック（API Client等）。
- **現状**: 空。必要が出た時に追加。

---

## Dependency Rules

依存関係の方向性は厳格に管理します。

1. **`pages`**
    - ⭕ OK: `features`, `layouts`, `content`, `lib`, `assets`
    - ❌ NG: 他の `pages`

2. **`features`**
    - ⭕ OK: `lib`, `assets`, `content` (Types/Utilsのみ)
    - ❌ NG: `pages`, `layouts`, 他の `features`

3. **`layouts`**
    - ⭕ OK: `lib`, `assets`, `features` (Navigationなどの全域共通要素のみ)
    - ❌ NG: `pages`
