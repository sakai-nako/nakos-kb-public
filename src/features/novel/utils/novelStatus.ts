import type { CollectionEntry } from 'astro:content';

type NovelStatus = CollectionEntry<'novels'>['data']['status'];

export const NOVEL_STATUS_LABELS: Record<NovelStatus, string> = {
  ongoing: '連載中',
  completed: '完結',
  hiatus: '休載中',
};

/** 作品の最終更新日でフォーマット統一（JST 固定で CI 環境でもズレない） */
export const formatNovelDate = (date: Date): string =>
  date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Tokyo',
  });
