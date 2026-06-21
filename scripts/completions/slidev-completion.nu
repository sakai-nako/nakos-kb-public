# プロジェクト `nakos-kb` 用の NuShell completion - Slidev / デッキ管理
#
# 使い方:
#   1. プロジェクトルートで一時的に有効化:
#        source scripts/slidev-completion.nu
#
#   2. ユーザー環境に永続化（~/.config/nushell/env.nu など）:
#        source /path/to/nakos-kb/scripts/slidev-completion.nu
#
#   補完対象:
#     `just slidev <TAB>`     → src 側デッキ名（src/content/slides/<name>/index.md）
#     `just sim-video <TAB>`  → 同上（draft: true なデッキも含む。リハ動画は draft 中によく使うため）

# src 側のデッキ一覧（_shared と index.md を持たないディレクトリは除外）
def nu-complete-src-slide-decks [] {
    ls src/content/slides
    | where type == dir
    | where {|d| ($d.name | path basename) != "_shared" and (($d.name | path join "index.md") | path exists)}
    | each {|d| $d.name | path basename}
}

extern "just slidev" [
    name: string@nu-complete-src-slide-decks  # デッキ名
]

extern "just sim-video" [
    deck: string@nu-complete-src-slide-decks  # デッキ名
]
