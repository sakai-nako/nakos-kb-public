# プロジェクト `nakos-kb` 用 completion 一括ローダー
#
# 使い方:
#   1. プロジェクトルートで一時的に有効化:
#        source scripts/completions.nu
#
#   2. ユーザー環境に永続化（~/.config/nushell/env.nu など）:
#        source /path/to/nakos-kb/scripts/completions.nu
#
# このファイルは `path self` で自身の所在を解決するので、CWD に依存せず動きます。
# 個別の completion を選んで読みたい場合は、対応する `*-completion.nu` を直接 source してください。

const SCRIPT_DIR = path self | path dirname

source ($SCRIPT_DIR | path join "completions" "novel-completion.nu")
source ($SCRIPT_DIR | path join "completions" "slidev-completion.nu")
