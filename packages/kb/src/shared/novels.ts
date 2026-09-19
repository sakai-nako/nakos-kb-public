import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.env.KB_CONTENT_ROOT ?? 'src/content/novels');
export type Chapter = { title: string; slug: string; sequence: number; body: string };
export type Novel = {
  title: string;
  slug: string;
  status: string;
  synopsis: string;
  chapters: Chapter[];
};
type IndexFields = { title: string; status: 'ongoing' | 'completed' | 'hiatus'; synopsis: string };
type ChapterFields = { title: string; slug: string; sequence: number };
const safeSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const statuses = new Set<IndexFields['status']>(['ongoing', 'completed', 'hiatus']);
const heading = /(^|\n)[ \t]*#{1,6}(?:[ \t]|$)/;
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function exactKeys(value: Record<string, unknown>, expected: string[]) {
  const actual = Object.keys(value).sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}
function metadata(source: string, kind: 'index'): { fields: IndexFields; body: string };
function metadata(source: string, kind: 'chapter'): { fields: ChapterFields; body: string };
function metadata(source: string, kind: 'index' | 'chapter') {
  const match = /^---\n([^\n]+)\n---\n([\s\S]*)$/.exec(source);
  if (!match) throw new Error('invalid KB JSON frontmatter');
  let fields: unknown;
  try {
    fields = JSON.parse(match[1]);
  } catch {
    throw new Error('invalid KB JSON frontmatter');
  }
  if (!isRecord(fields)) throw new Error('invalid KB JSON frontmatter');
  if (kind === 'index') {
    if (
      !exactKeys(fields, ['status', 'synopsis', 'title']) ||
      typeof fields.title !== 'string' ||
      !fields.title.trim() ||
      typeof fields.synopsis !== 'string' ||
      typeof fields.status !== 'string' ||
      !statuses.has(fields.status as IndexFields['status'])
    )
      throw new Error('invalid KB index metadata');
    return { fields: fields as IndexFields, body: match[2] };
  }
  if (
    !exactKeys(fields, ['sequence', 'slug', 'title']) ||
    typeof fields.title !== 'string' ||
    !fields.title.trim() ||
    typeof fields.slug !== 'string' ||
    !safeSlug.test(fields.slug) ||
    !Number.isInteger(fields.sequence) ||
    fields.sequence <= 0 ||
    !match[2] ||
    heading.test(match[2])
  )
    throw new Error('invalid KB chapter metadata');
  return { fields: fields as ChapterFields, body: match[2] };
}
export function novels(): Novel[] {
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => novel(entry.name))
    .filter((value): value is Novel => value !== null)
    .sort((a, b) => a.title.localeCompare(b.title, 'ja'));
}
export function novel(slug: string): Novel | null {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  const dir = path.join(root, slug);
  const index = path.join(dir, 'index.md');
  if (!fs.existsSync(index)) return null;
  const { fields } = metadata(fs.readFileSync(index, 'utf8'), 'index');
  const chapters = fs
    .readdirSync(dir)
    .filter((file) => /^\d{2,}-.+\.md$/.test(file))
    .map((file) => {
      const { fields, body } = metadata(fs.readFileSync(path.join(dir, file), 'utf8'), 'chapter');
      return { title: fields.title, slug: fields.slug, sequence: fields.sequence, body };
    })
    .sort((a, b) => a.sequence - b.sequence);
  if (
    new Set(chapters.map((chapter) => chapter.sequence)).size !== chapters.length ||
    new Set(chapters.map((chapter) => chapter.slug)).size !== chapters.length
  )
    throw new Error('duplicate KB chapter metadata');
  return {
    title: fields.title,
    slug,
    status: fields.status,
    synopsis: fields.synopsis ?? '',
    chapters,
  };
}
