---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*), Bash(git push:*), Bash(git diff:*), Bash(git log:*), Bash(git branch:*), Bash(git rev-parse:*)
description: 現在のブランチで commit & push (PR は作らない)
---

## Context

- Current git status: !`git status`
- Current git diff (staged and unstaged changes): !`git diff HEAD`
- Current branch: !`git branch --show-current`
- Upstream: !`git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>&1 || echo '(no upstream)'`
- Recent commits: !`git log --oneline -10`

## Your task

上記の変更内容を元に:

1. 適切な commit message で 1 つの commit を作成する (Conventional Commits、[.claude/rules/90-docs.md](../rules/90-docs.md) に従う)。
2. 現在のブランチを upstream にそのまま push する (新しいブランチは切らない、PR も作らない)。

upstream が未設定の場合は `git push -u origin <current-branch>` で初回 push を行う。

You have the capability to call multiple tools in a single response. Stage, commit, push を 1 メッセージで実行する。それ以外のツールや余計なメッセージは出さない。

## 注意

- 論理的に独立な変更が複数混在している場合は、**1 コミットにまとめず**ユーザーに分割案を出して確認する (例: `feat(cfp): ...` と `feat(scripts): ...` が混在)。
- 生成物 (`dist/`, `.astro/`, `node_modules/`, `src/content/slides/*/_sim/`) は `.gitignore` 済みのはずだが、誤って `git add -A` 等で混入していたら除外する。
- pre-commit hook が失敗したら原因を直して新しい commit を作る (`--amend` や `--no-verify` は使わない)。
- commit footer に `Co-Authored-By` の AI 自動署名を入れるかは、直近 commit を `git log -5` で確認して揃える。
