# Nako's Knowledge Base

> [!NOTE]
> このリポジトリは、私的に運用しているプライベートリポジトリの**フィルタ済み公開ミラー**です (生成元コミット: `63b2b48`)。
> 個人ディレクトリ (`content-private/`, `content-external/`, `docs/`) の除外と Cloudflare Pages デプロイ workflow の除去を行ったスナップショットを、
> [scripts/publish-public-mirror.ps1](scripts/publish-public-mirror.ps1) で随時 push しています。
> private 側に実コミット履歴があるため、このミラーには履歴は含まれません。

## プロジェクトのAIルール設定 (`.claude/rules`)

このプロジェクトでは、AIエージェント（Antigravity等）が効率的にコードを理解・生成できるように、`.claude/rules` ディレクトリにルール定義ファイルを配置しています。

### ファイル構成と命名規則

ファイル名の先頭にある番号は、以下の意図で付けられています：

1.  **読み込み優先度**:
    数字が小さいファイル（00, 10...）ほど、プロジェクトの根幹に関わる重要なルールです。エージェントはこれらを優先的に参照します。

2.  **カテゴリ分け**:
    - `00-19`: **基盤・絶対ルール** (Core, Tech Stack)
    - `20-39`: **実装・設計詳細** (Coding Style, Architecture)
    - `40-79`: **品質・検証** (Testing)
    - `80-99`: **運用・その他** (Security, Docs)

3.  **拡張性**:
    10刻みにすることで、将来的に新しいカテゴリのルール（例: `15-database.md`）が必要になった際に、適切な順序で追加できるようにしています。
