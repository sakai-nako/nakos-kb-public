# Testing

テストに関するガイドラインです。現在は必須ではありませんが、将来的な導入を見据えて記述します。

## Current Status

- 現在、自動テスト環境は構築されていません。

## Future Recommendations

テストを導入する場合の推奨ツール：

### Unit Testing

- **Tool**: [Vitest](https://vitest.dev/)
- **Target**: ユーティリティ関数、複雑なロジックを持つコンポーネント。

### E2E Testing

- **Tool**: [Playwright](https://playwright.dev/)
- **Target**: 重要なユーザーフロー、ページ遷移の確認。

## Manual Verification

- コード変更後は、必ずローカルサーバー (`just dev`) でブラウザから表示を確認してください。
- エラーコンソールに警告が出ていないか確認してください。
