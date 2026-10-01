// イベントの一覧と詳細の表示規則。設計は docs/specs/2026-10-01-003-events-talks-design.md (#244)。

const roleLabels: Record<string, string> = {
  speaker: '登壇',
  organizer: '運営',
  cfp_submitter: 'CfP 応募',
  attendee: '参加',
};

/** 関わり方の日本語名。表に無い値は元の値のまま返す。 */
export function roleLabel(tag: string): string {
  return roleLabels[tag] ?? tag;
}

export function isTalk(item: { how_relate: string[] }): boolean {
  return item.how_relate.includes('speaker');
}

export type Presentation = { title: string; href: string; platform: string | null };
type MaterialLike = { title: string; url: string; platform: string | null };
type DeckLink = { title: string; href: string };

const withSlash = (pathname: string) => (pathname.endsWith('/') ? pathname : `${pathname}/`);

/**
 * サイト内のデッキを先に並べ、資料のうち URL のパスがデッキと同じものを除いて続ける。
 * デッキはイベントのノートの materials にも記録されるので、除かないと同じ資料が 2 回出る。
 */
export function presentations(materials: MaterialLike[], decks: DeckLink[]): Presentation[] {
  const deckPaths = new Set(decks.map((deck) => withSlash(deck.href)));
  const rest = materials
    .filter((material) => !deckPaths.has(withSlash(new URL(material.url).pathname)))
    .map((material) => ({
      title: material.title,
      href: material.url,
      platform: material.platform,
    }));
  return [
    ...decks.map((deck) => ({ title: deck.title, href: deck.href, platform: null })),
    ...rest,
  ];
}
