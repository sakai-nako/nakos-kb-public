import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.env.KB_BLOG_CONTENT_ROOT ?? 'src/content/blog');
const blogId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export type Post = {
  id: string;
  title: string;
  description: string;
  pubDate: string;
  tags: string[];
  body: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
function exactKeys(value: Record<string, unknown>, expected: string[]) {
  const actual = Object.keys(value).sort();
  return actual.length === expected.length && actual.every((key, i) => key === expected[i]);
}
function parse(source: string, id: string): Post {
  const match = /^---\n([^\n]+)\n---\n([\s\S]*)$/.exec(source);
  if (!match) throw new Error('invalid KB JSON frontmatter');
  let fields: unknown;
  try {
    fields = JSON.parse(match[1]);
  } catch {
    throw new Error('invalid KB JSON frontmatter');
  }
  const body = match[2];
  if (
    !isRecord(fields) ||
    !exactKeys(fields, ['description', 'pubDate', 'tags', 'title']) ||
    typeof fields.title !== 'string' ||
    !fields.title.trim() ||
    typeof fields.description !== 'string' ||
    !fields.description.trim() ||
    typeof fields.pubDate !== 'string' ||
    !isoDate.test(fields.pubDate) ||
    !Array.isArray(fields.tags) ||
    fields.tags.some((tag) => typeof tag !== 'string') ||
    !body.trim()
  )
    throw new Error('invalid KB blog metadata');
  return {
    id,
    title: fields.title,
    description: fields.description,
    pubDate: fields.pubDate,
    tags: fields.tags as string[],
    body,
  };
}
export function posts(): Post[] {
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => {
      const id = path.basename(entry.name, '.md');
      if (!blogId.test(id)) throw new Error('unsafe KB blog path');
      return parse(fs.readFileSync(path.join(root, entry.name), 'utf8'), id);
    })
    .sort((a, b) => b.pubDate.localeCompare(a.pubDate) || b.id.localeCompare(a.id));
}
export function post(id: string): Post | null {
  return blogId.test(id) ? (posts().find((item) => item.id === id) ?? null) : null;
}
// pubDate は日付だけの文字列なので、Date を挟まずに整形する (実行環境の時差で日がずれない)。
export function formatPubDate(pubDate: string) {
  return pubDate.replaceAll('-', '/');
}
