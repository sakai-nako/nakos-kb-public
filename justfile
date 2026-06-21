set quiet
set shell := ["nu", "-l", "-c"]



[private]
default:
    just -l --unsorted
    
git-update:
    git add -A; git commit -m "Update"; git push
    
# Install dependencies
install:
    pnpm install

# Astro development server
dev:
    -pnpm dev

# Build Astro site with Slides
build:
    pnpm build
    pnpm build:slides

# Build Slides
build-slides:
    pnpm build:slides

# Preview built site
preview:
    pnpm preview

# ESLint + Prettier check
check:
    pnpm check

# Prettier format only
format:
    pnpm format

# ESLint lint only
lint:
    pnpm lint

# Run Slidev with a deck (directory name under src/content/slides/). draft: true なデッキも同じコマンドで開ける
slidev name:
    pnpm slidev src/content/slides/{{name}}/index.md

# Set up slides: per-deck junctions and copies under src/content/slides/. Idempotent. Re-run after updating _shared/global-bottom.vue or _shared/vite.config.ts.
setup-slides:
    node scripts/setup-slides.mjs

# Convert a novel chapter to Kakuyomu format (writes to stdout)
# Pipe to clipboard:
#   Windows: just novel-kakuyomu <file> | clip
#   macOS:   just novel-kakuyomu <file> | pbcopy
#   Linux:   just novel-kakuyomu <file> | xclip -selection clipboard
novel-kakuyomu file:
    node scripts/novel-export-kakuyomu.mjs {{file}}

# Convert a blog entry (src/content/blog/<slug>.md) to Zenn article format (writes to stdout)
# Frontmatter mapping: title/tags/draft をそのまま、emoji/type は platforms.zenn か既定値。
# 本文冒頭に canonical URL の注記を自動挿入。
# Pipe to clipboard:
#   Windows: just blog-to-zenn <slug> | clip
#   macOS:   just blog-to-zenn <slug> | pbcopy
blog-to-zenn slug:
    node scripts/blog-to-zenn.mjs {{slug}}

# Build CV PDFs (履歴書・職務経歴書) into content-external/cv/out/
cv:
    mkdir content-external/cv/out
    typst compile content-external/cv/rirekisho.typ content-external/cv/out/rirekisho.pdf
    typst compile content-external/cv/shokumu-keireki.typ content-external/cv/out/shokumu-keireki.pdf

# Watch a CV doc and rebuild on save (name = rirekisho | shokumu-keireki)
cv-watch name:
    mkdir content-external/cv/out
    typst watch content-external/cv/{{name}}.typ content-external/cv/out/{{name}}.pdf

# Build a rehearsal video for a draft deck: VOICEVOX narration + slidev PNG + ffmpeg.
# Incremental: only changed slides/audio are rebuilt (state in _sim/.manifest.json).
# For a full rebuild, delete the deck's _sim/ directory first.
# Requires: VOICEVOX engine on :50021, playwright-chromium, ffmpeg.
#   just sim-video 2026-05-29-cfp-toudan-no-susume          # speaker=30(No.7), speed=0.9
#   just sim-video 2026-05-29-cfp-toudan-no-susume 13 0.85  # 青山龍星, やや遅め
sim-video deck speaker="30" speed="0.9":
    node scripts/build-sim-video.mjs {{deck}} {{speaker}} {{speed}}

# Publish a filtered snapshot of HEAD to the public mirror repo (../nakos-kb-public/).
# Filter rules live in scripts/public-mirror-rules.psd1.
#   just publish-public-mirror          # commit only (no push)
#   just publish-public-mirror --Push   # commit + push to GitHub
publish-public-mirror *args:
    pwsh -NoProfile -File scripts/publish-public-mirror.ps1 {{args}}
