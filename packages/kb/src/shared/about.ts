import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.env.KB_ABOUT_CONTENT_ROOT ?? 'src/content/about');
const safeSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const expectedFields = new Set(['date', 'draft', 'summary', 'title', 'type']);

export type AboutEntry = {
  slug: string;
  title: string;
  summary: string;
  type: string;
  body: string;
};

function quoted(value: string) {
  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'string' ? parsed : null;
    } catch {
      return null;
    }
  }
  return value;
}

function parse(source: string, slug: string): AboutEntry | null {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(source);
  if (!match) throw new Error('invalid About frontmatter');
  const fields: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const field = /^([a-z]+):[ \t]*(.*)$/.exec(line);
    if (!field || !expectedFields.has(field[1]) || Object.hasOwn(fields, field[1]))
      throw new Error('invalid About frontmatter');
    const value = quoted(field[2]);
    if (value === null) throw new Error('invalid About frontmatter');
    fields[field[1]] = value;
  }
  if (
    Object.keys(fields).length !== expectedFields.size ||
    ![...expectedFields].every((field) => Object.hasOwn(fields, field)) ||
    !fields.title.trim() ||
    !fields.summary.trim() ||
    !fields.type.trim() ||
    !fields.date.trim() ||
    !/^(true|false)$/.test(fields.draft)
  )
    throw new Error('invalid About metadata');
  if (fields.draft === 'true') return null;
  return { slug, title: fields.title, summary: fields.summary, type: fields.type, body: match[2] };
}

export function aboutEntries(): AboutEntry[] {
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => {
      const slug = path.basename(entry.name, '.md');
      if (!safeSlug.test(slug)) throw new Error('unsafe About path');
      return parse(fs.readFileSync(path.join(root, entry.name), 'utf8'), slug);
    })
    .filter((entry): entry is AboutEntry => entry !== null)
    .sort((a, b) => a.title.localeCompare(b.title, 'ja'));
}

export function aboutEntry(slug: string) {
  return safeSlug.test(slug) ? (aboutEntries().find((entry) => entry.slug === slug) ?? null) : null;
}
