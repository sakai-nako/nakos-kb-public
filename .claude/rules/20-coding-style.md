# Coding Style

Astroプロジェクトを一貫性を持って開発するためのコーディング規約です。

## Astro Components (`.astro`)

### 1. 構造

Astroコンポーネントは以下の順序で記述してください。

```astro
---
// 1. Imports
import SomeComponent from './SomeComponent.astro';

// 2. Props Definition
interface Props {
    title: string;
}

const { title } = Astro.props;

// 3. Logic / Script
const formattedTitle = title.toUpperCase();
---

<!-- 4. Template -->
<div class="container">
    <h1>{formattedTitle}</h1>
    <SomeComponent />
</div>

<!-- 5. Styles -->
<style>
    .container {
        /* Scoped CSS */
        padding: 1rem;
    }
</style>
```

### 2. コンポーネント設計

- **粒度**: UIパーツは対応する `src/features/<feature>/components/` に配置してください。
- **Slot**: 柔軟なレイアウトが必要な場合は `<slot />` を活用してください。

## TypeScript

- `any` 型の使用は極力避け、適切な型定義を行ってください。
- コンポーネントのPropsは `interface Props` で定義し、エクスポートする必要はありません（Astroが自動的に処理します）。

## Naming Convention

- **Components**: PascalCase (例: `Header.astro`, `CardItem.astro`)
- **Pages**: kebab-case (例: `index.astro`, `about-us.astro`)
- **Utilities**: camelCase (例: `formatDate.ts`)
