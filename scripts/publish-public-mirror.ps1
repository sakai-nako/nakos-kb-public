#Requires -Version 7
<#
.SYNOPSIS
    公開可能な内容だけにフィルタした HEAD のスナップショットを、公開ミラーリポジトリへコミットする。

.DESCRIPTION
    HEAD を git archive でステージングへ展開し、scripts/public-mirror-rules.psd1 のルール
    (除外パス / 実値置換 / 禁止パターン検査) を適用したうえで、ミラーリポジトリ
    (既定: このリポジトリの隣の nakos-kb-public) に「1 スナップショット = 1 コミット」を積む。
    private 側のコミット履歴は公開しない (履歴方式の理由と運用は将来 docs/runbooks/ に書く)。

    禁止パターンが 1 件でも検出された場合はミラーを更新せず中止する。

.PARAMETER Push
    コミット後、ミラーの origin (GitHub) へ push する。origin 未設定なら手順を表示して失敗する。

.PARAMETER MirrorDir
    ミラーリポジトリのパス。既定はこのリポジトリの親ディレクトリ直下の nakos-kb-public。

.EXAMPLE
    .\scripts\publish-public-mirror.ps1          # ミラーにコミットまで (push しない)
    .\scripts\publish-public-mirror.ps1 -Push    # GitHub へ push まで行う
#>
[CmdletBinding()]
param(
    [switch]$Push,
    [string]$MirrorDir
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path $PSScriptRoot -Parent
if (-not $MirrorDir) {
    $MirrorDir = Join-Path (Split-Path $repoRoot -Parent) 'nakos-kb-public'
}
$rules = Import-PowerShellDataFile (Join-Path $PSScriptRoot 'public-mirror-rules.psd1')

function Invoke-Git {
    param([Parameter(Mandatory)][string[]]$GitArgs)
    $out = & git @GitArgs 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "git $($GitArgs -join ' ') failed (exit $LASTEXITCODE): $out"
    }
    $out
}

# --- 1. 公開対象コミットの特定 -------------------------------------------------
$short = (Invoke-Git @('-C', $repoRoot, 'rev-parse', '--short', 'HEAD')).Trim()
$subject = (Invoke-Git @('-C', $repoRoot, 'log', '-1', '--format=%s', 'HEAD')) -join ' '
if (Invoke-Git @('-C', $repoRoot, 'status', '--porcelain')) {
    Write-Warning "作業ツリーに未コミットの変更があります。公開対象は HEAD ($short) の内容のみです。"
}

# --- 2. ステージングへ展開 -----------------------------------------------------
# git archive zip + Expand-Archive (.NET の System.IO.Compression) を使う。
# tar 経由だと Windows の bsdtar / MSYS tar 双方で UTF-8 ファイル名が CP932 と誤解釈されて
# 日本語ファイル名が化ける問題があるため、UTF-8 フラグ (zip general purpose bit 11) を
# 尊重する .NET zip ハンドラに任せる。
$stage = Join-Path ([IO.Path]::GetTempPath()) 'nakos-kb-public-stage'
$zipPath = Join-Path ([IO.Path]::GetTempPath()) 'nakos-kb-public-stage.zip'
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Path $stage | Out-Null
Invoke-Git @('-C', $repoRoot, 'archive', '--format=zip', '-o', $zipPath, 'HEAD') | Out-Null
Expand-Archive -Path $zipPath -DestinationPath $stage -Force
Remove-Item $zipPath

# --- 3. 除外パスの削除 ---------------------------------------------------------
$removed = [System.Collections.Generic.List[string]]::new()
foreach ($file in Get-ChildItem -Path $stage -Recurse -File -Force) {
    $rel = [IO.Path]::GetRelativePath($stage, $file.FullName).Replace('\', '/')
    foreach ($pattern in $rules.ExcludePaths) {
        if ($rel -like $pattern) {
            Remove-Item -LiteralPath $file.FullName -Force
            $removed.Add($rel)
            break
        }
    }
}
# 空になったディレクトリを掃除 (深い側から)
Get-ChildItem -Path $stage -Recurse -Directory |
    Sort-Object { $_.FullName.Length } -Descending |
    Where-Object { -not (Get-ChildItem -LiteralPath $_.FullName -Force) } |
    Remove-Item -Force

# --- 4. 実値の置換 -------------------------------------------------------------
$replaced = [System.Collections.Generic.List[string]]::new()
foreach ($file in Get-ChildItem -Path $stage -Recurse -File) {
    $raw = [IO.File]::ReadAllText($file.FullName)
    if ($raw.Contains([char]0)) { continue }   # バイナリはスキップ
    $new = $raw
    foreach ($r in $rules.Replacements) { $new = $new.Replace($r.From, $r.To) }
    if ($new -ne $raw) {
        [IO.File]::WriteAllText($file.FullName, $new)
        $replaced.Add([IO.Path]::GetRelativePath($stage, $file.FullName).Replace('\', '/'))
    }
}

# --- 5. README に公開ミラーの注記を挿入 (タイトル行の直後) ----------------------
$notice = @'

> [!NOTE]
> このリポジトリは、私的に運用しているプライベートリポジトリの**フィルタ済み公開ミラー**です (生成元コミット: `{0}`)。
> 個人ディレクトリ (`content-private/`, `content-external/`, `docs/`) の除外と Cloudflare Pages デプロイ workflow の除去を行ったスナップショットを、
> [scripts/publish-public-mirror.ps1](scripts/publish-public-mirror.ps1) で随時 push しています。
> private 側に実コミット履歴があるため、このミラーには履歴は含まれません。
'@ -f $short
$readmePath = Join-Path $stage 'README.md'
if (Test-Path $readmePath) {
    $readme = [IO.File]::ReadAllText($readmePath)
    $titleEnd = $readme.IndexOf("`n")
    # 注記の後ろに空行を置かないと、直後の本文行が blockquote に取り込まれる
    [IO.File]::WriteAllText($readmePath, $readme.Insert($titleEnd + 1, $notice + "`n"))
}

# --- 6. 禁止パターン検査 (安全網) ----------------------------------------------
$violations = [System.Collections.Generic.List[string]]::new()
foreach ($file in Get-ChildItem -Path $stage -Recurse -File) {
    $rel = [IO.Path]::GetRelativePath($stage, $file.FullName).Replace('\', '/')
    foreach ($p in $rules.ForbiddenPatterns) {
        foreach ($hit in (Select-String -LiteralPath $file.FullName -Pattern $p.Pattern)) {
            $violations.Add(('{0}:{1} [{2}] {3}' -f $rel, $hit.LineNumber, $p.Reason, $hit.Line.Trim()))
        }
    }
}
if ($violations.Count -gt 0) {
    $violations | ForEach-Object { Write-Host "  NG $_" -ForegroundColor Red }
    throw "禁止パターンが $($violations.Count) 件検出されました。公開を中止します (ミラーは未更新)。"
}

# --- 7. ミラーリポジトリへ反映 --------------------------------------------------
if (-not (Test-Path (Join-Path $MirrorDir '.git'))) {
    New-Item -ItemType Directory -Path $MirrorDir -Force | Out-Null
    Invoke-Git @('init', '-b', 'main', $MirrorDir) | Out-Null
    Write-Host "ミラーリポジトリを新規作成しました: $MirrorDir"
}
robocopy $stage $MirrorDir /MIR /XD .git /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy が失敗しました (exit $LASTEXITCODE)" }

Invoke-Git @('-C', $MirrorDir, 'add', '-A') | Out-Null
& git -C $MirrorDir diff --cached --quiet
$committed = $false
if ($LASTEXITCODE -ne 0) {
    Invoke-Git @('-C', $MirrorDir, 'commit', '-m', ('Publish snapshot of {0}: {1}' -f $short, $subject)) | Out-Null
    $committed = $true
}

# --- 8. push (オプション) ------------------------------------------------------
if ($Push) {
    $remotes = @(& git -C $MirrorDir remote)
    if ($remotes -notcontains 'origin') {
        throw ("ミラーに origin が未設定です。先に GitHub リポジトリを作成して登録してください:`n" +
            "  gh repo create <owner>/nakos-kb-public --public`n" +
            "  git -C `"$MirrorDir`" remote add origin https://github.com/<owner>/nakos-kb-public.git")
    }
    Invoke-Git @('-C', $MirrorDir, 'push', 'origin', 'main')
}

# --- サマリ ---------------------------------------------------------------------
Write-Host ''
Write-Host "公開スナップショット: $short ($subject)"
Write-Host ("  除外: {0} ファイル ({1})" -f $removed.Count, (($removed | Select-Object -First 3) -join ', ') + ($removed.Count -gt 3 ? ', ...' : ''))
Write-Host ("  置換適用: {0} ファイル ({1})" -f $replaced.Count, ($replaced -join ', '))
Write-Host ("  ミラー: {0} — {1}" -f $MirrorDir, ($committed ? 'コミット作成' : '差分なし (最新)'))
Write-Host ("  push: {0}" -f ($Push ? '完了' : '未実行 (-Push で GitHub へ送信)'))
