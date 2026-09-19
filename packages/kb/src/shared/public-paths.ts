// URL の組み立てに要るのは slug だけなので、loader の Novel 型を import せず構造で受ける。
// novels.ts を引き込むと node:test 側の型検査に Astro 用の設定が要る。
type NovelSlugs = { slug: string; chapters: { slug: string }[] };

type NovelAlias = { canonical: string; chapters: Record<string, string> };

// Imported projection content is replaceable. Keep historic public paths here instead.
// New projections use their bundle slug until a reviewed legacy alias is added.
export const legacyPathManifest: Readonly<Record<string, NovelAlias>> = {
  'cadenza-engineering': {
    canonical: 'cadenza-engineering',
    chapters: {
      'cadenza-engineering-01-not-on-the-symbols': '01-not-on-the-symbols',
      'cadenza-engineering-02-as-a-gift': '02-as-a-gift',
      'cadenza-engineering-03-meaning-in-the-numbers': '03-meaning-in-the-numbers',
    },
  },
};

export function novelPath(slug: string) {
  return `/novels/${legacyPathManifest[slug]?.canonical ?? slug}`;
}
export function chapterPath(novelSlug: string, chapterSlug: string) {
  const aliases = legacyPathManifest[novelSlug];
  return `${novelPath(novelSlug)}/${aliases?.chapters[chapterSlug] ?? chapterSlug}`;
}
export function canonicalNovelPath(item: NovelSlugs) {
  return novelPath(item.slug);
}
export function canonicalChapterPath(item: NovelSlugs, chapterSlug: string) {
  return chapterPath(item.slug, chapterSlug);
}
export function resolveNovelSlug(pathSlug: string, items: NovelSlugs[]) {
  return items.find((item) => novelPath(item.slug) === `/novels/${pathSlug}`)?.slug ?? null;
}
export function eventPath(id: string) {
  return `/events/${id}`;
}
export function blogPath(slug: string) {
  return `/blog/${slug}`;
}
// デッキは Slidev が build する SPA なので、末尾の `/` まで含めて 1 つの URL にする。
export function slidesPath(slug: string) {
  return `/slides/${slug}/`;
}
export function cfpPath(slug: string) {
  return `/cfp/${slug}`;
}
export function cfpDraftsPath(slug: string) {
  return `/cfp/${slug}/drafts`;
}
export function resolveChapterSlug(item: NovelSlugs, pathSlug: string) {
  return (
    item.chapters.find((chapter) => chapterPath(item.slug, chapter.slug).endsWith(`/${pathSlug}`))
      ?.slug ?? null
  );
}
