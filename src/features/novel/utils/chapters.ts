import type { CollectionEntry } from 'astro:content';

type Chapter = CollectionEntry<'novel_chapters'>;

/**
 * 章エントリの id は「<作品 slug>/<NN-章 slug>」形式（glob loader がファイルパスから生成）。
 * 章ファイル自体は frontmatter に title しか持たない規約のため、所属作品は id から導出する。
 */
export const novelSlugOf = (chapter: Chapter): string => chapter.id.split('/')[0];

export const chapterSlugOf = (chapter: Chapter): string => chapter.id.split('/')[1];

/** 指定作品の章を、ファイル名プレフィックス（NN-）順に返す。draft 章は除外 */
export const chaptersOf = (allChapters: Chapter[], novelSlug: string): Chapter[] =>
  allChapters
    .filter((chapter) => novelSlugOf(chapter) === novelSlug && !chapter.data.draft)
    .sort((a, b) => a.id.localeCompare(b.id));
