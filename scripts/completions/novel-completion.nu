# プロジェクト `nakos-kb` 用の NuShell completion
#
# 使い方:
#   1. プロジェクトルートで一時的に有効化:
#        source scripts/novel-completion.nu
#
#   2. ユーザー環境に永続化（~/.config/nushell/env.nu など）:
#        source /path/to/nakos-kb/scripts/novel-completion.nu
#
#   補完対象:
#     `just novel-kakuyomu <TAB>` → 章ファイル（src/content/novels/ からの相対パス）

# 章ファイル（NN-<slug>.md、_ 始まりの補助ファイルは除く）を src/content/novels/ からの相対パスで列挙
def nu-complete-novel-chapters [] {
    glob src/content/novels/**/[0-9][0-9]-*.md
    | each {|p| $p | path relative-to (pwd | path join "src" "content" "novels")}
}

# `just novel-kakuyomu` の引数補完
extern "just novel-kakuyomu" [
    file: string@nu-complete-novel-chapters  # 章ファイルパス
]
