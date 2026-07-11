import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

const slides = defineCollection({
  type: 'content',
  // Schema for Slidev frontmatter
  schema: z.object({
    title: z.string(),
    info: z.string().optional(),
    theme: z.string().optional(),
    // サイトに出さないデッキは draft: true で除外する（Slidev は未知 frontmatter を素通しするので影響なし）
    draft: z.boolean().default(false),
    // Allow other Slidev specific properties
    background: z.string().optional(),
    class: z.string().optional(),
    highlighter: z.string().optional(),
    lineNumbers: z.boolean().optional(),
    drawings: z
      .object({
        persist: z.boolean().optional(),
      })
      .optional(),
    transition: z.string().optional(),
    css: z.string().optional(),
    event: reference('events').nullish(),
  }),
});

const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: z.object({
    event_name: z.string(),
    start_datetime: z.string(),
    end_datetime: z.string(),
    event_link: z.string().url().nullish(),
    how_relate: z.array(z.string()).nullish(),
  }),
});

const cfp = defineCollection({
  // 1 CFP = 1 ディレクトリ（<slug>/index.md）。`_` 始まりの補助ファイル（_memo.md など）はパターンに合致しないため対象外
  // generateId: id を `<slug>/index` → `<slug>` に正規化（URL ルーティングと cfp_drafts との対応で扱いやすく）
  loader: glob({
    pattern: '*/index.md',
    base: './src/content/cfp',
    generateId: ({ entry }) => entry.replace(/\/index\.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    // /cfp/<slug> 専用ページの生成可否。デフォルト false（公開）。完全に下書きで隠したい場合のみ true
    draft: z.boolean().default(false),
    // 応募の進行状態。応募前は未設定（events 詳細ページの CFP セクションでは未設定のものは非表示）。応募したら submitted を入れる。draft とは独立した軸
    status: z.enum(['submitted', 'accepted', 'rejected', 'withdrawn']).optional(),
    submitted_at: z.string(),
    event: reference('events').nullish(),
    url: z.string().url().nullish(),
    target_audience: z.string().optional(),
    hook: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

const cfp_drafts = defineCollection({
  // 校正過程ドキュメント（<slug>/drafts.md）。id を cfp と揃えることで getEntry('cfp_drafts', cfp.id) で参照できる
  loader: glob({
    pattern: '*/drafts.md',
    base: './src/content/cfp',
    generateId: ({ entry }) => entry.replace(/\/drafts\.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
  }),
});

const presentation_material = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/presentation_material' }),
  schema: z.object({
    material_title: z.string(),
    material_url: z.string().url(),
    platform: z.enum(['docswell', 'speakerdeck', 'slidev', 'other']).optional(),
    presented_at: z.string().optional(),
    event: reference('events').nullish(),
  }),
});

// 各プラットフォーム投稿先 URL（カクヨム等）。書く場合だけ表示にリンクが出る
const novelPlatformsSchema = z
  .object({
    kakuyomu: z
      .object({
        url: z.string().url(),
      })
      .optional(),
  })
  .optional();

const novels = defineCollection({
  // 作品メタ（<作品 slug>/index.md）。`_` 始まりの補助ファイルはパターンに合致しないため公開対象外
  loader: glob({ pattern: '*/index.md', base: './src/content/novels' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    // 進行状態。サイト非公開は status ではなく `draft: true` で表現する
    status: z.enum(['ongoing', 'completed', 'hiatus']),
    draft: z.boolean().default(false),
    synopsis: z.string(),
    tags: z.array(z.string()).optional(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
    platforms: novelPlatformsSchema,
  }),
});

const novel_chapters = defineCollection({
  // 章ファイル（NN-<章 slug>.md）。並び順はファイル名プレフィックスで確定
  loader: glob({ pattern: '*/[0-9][0-9]-*.md', base: './src/content/novels' }),
  schema: z.object({
    title: z.string(),
    draft: z.boolean().default(false),
    platforms: novelPlatformsSchema,
  }),
});

const about = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    type: z.enum(['profile', 'self-portrait']),
    date: z.string(),
    summary: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).optional(),
    // 各プラットフォーム向け変換時に上書きしたいメタ（省略時はデフォルトを使う）
    platforms: z
      .object({
        zenn: z
          .object({
            emoji: z.string().optional(),
            type: z.enum(['tech', 'idea']).optional(),
          })
          .optional(),
      })
      .optional(),
  }),
});

export const collections = {
  slides,
  presentation_material,
  events,
  cfp,
  cfp_drafts,
  novels,
  novel_chapters,
  about,
  blog,
};
