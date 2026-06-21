# Documentation & Process

開発プロセスとドキュメントに関するルールです。

## Commit Messages

コミットメッセージは [Conventional Commits](https://www.conventionalcommits.org/) 形式に従います。

```
<type>(<scope>): <short description>

<optional body with bullet points if needed>
```

### Type

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメントのみの変更
- `style`: コードの意味に影響しない変更（空白、フォーマットなど）
- `refactor`: バグ修正も機能追加も行わないコード変更
- `chore`: ビルド・ツール設定等

### Scope

変更対象のモジュールやコンポーネント（例: `biome`, `auth`, `api`）

### 例

```
feat(slides): スライド一覧ページのカード表示を追加

- SlideListコンポーネントを新規作成
- レスポンシブグリッドレイアウトを実装
```

## Comments

- コード自体が説明的であることを目指してください（自己文書化コード）。
- 複雑なロジックや、「なぜそうしたのか」という意図がある場合はコメントを残してください。
- JSDoc形式 (`/**Context*/`) を推奨します。

## README

- プロジェクトのセットアップ方法や重要な変更があった場合は、ルートの `README.md` を更新してください。
