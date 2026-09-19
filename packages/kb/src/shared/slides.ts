import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.env.KB_SLIDES_CONTENT_ROOT ?? 'src/content/slides');
const deckId = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export type Deck = {
  id: string;
  title: string;
  event: string | null;
  eventName: string | null;
  eventDate: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
function exactKeys(value: Record<string, unknown>, expected: string[]) {
  const actual = Object.keys(value).sort();
  return actual.length === expected.length && actual.every((key, i) => key === expected[i]);
}
const optionalText = (value: unknown) => value === null || typeof value === 'string';
// デッキ本体は Slidev が別に build する。ここが読むのは投影が足す meta.json だけで、
// index.md の Slidev frontmatter は読まない。
function parse(source: string, id: string): Deck {
  let fields: unknown;
  try {
    fields = JSON.parse(source);
  } catch {
    throw new Error('invalid KB slides metadata');
  }
  if (
    !isRecord(fields) ||
    !exactKeys(fields, ['event', 'eventDate', 'eventName', 'title']) ||
    typeof fields.title !== 'string' ||
    !fields.title.trim() ||
    (fields.event !== null && (typeof fields.event !== 'string' || !deckId.test(fields.event))) ||
    !optionalText(fields.eventName) ||
    (fields.eventDate !== null &&
      (typeof fields.eventDate !== 'string' || !isoDate.test(fields.eventDate)))
  )
    throw new Error('invalid KB slides metadata');
  return {
    id,
    title: fields.title,
    event: fields.event as string | null,
    eventName: fields.eventName as string | null,
    eventDate: fields.eventDate as string | null,
  };
}
export function decks(): Deck[] {
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => {
      const id = entry.name;
      if (!deckId.test(id)) throw new Error('unsafe KB slides path');
      return parse(fs.readFileSync(path.join(root, id, 'meta.json'), 'utf8'), id);
    })
    .sort(
      (a, b) => (b.eventDate ?? '').localeCompare(a.eventDate ?? '') || b.id.localeCompare(a.id),
    );
}
export function deck(id: string): Deck | null {
  return deckId.test(id) ? (decks().find((item) => item.id === id) ?? null) : null;
}
export function decksForEvent(eventId: string): Deck[] {
  return decks().filter((item) => item.event === eventId);
}
// eventDate は日付だけの文字列なので、Date を挟まずに整形する (実行環境の時差で日がずれない)。
export function formatEventDate(eventDate: string) {
  return eventDate.replaceAll('-', '/');
}
