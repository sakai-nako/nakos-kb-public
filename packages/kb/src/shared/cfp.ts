import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.env.KB_CFP_CONTENT_ROOT ?? 'src/content/cfp');
const cfpId = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const statuses = new Set(['submitted', 'accepted', 'rejected', 'withdrawn']);

export type CfpDrafts = { title: string; body: string };
export type Cfp = {
  id: string;
  title: string;
  status: string | null;
  submitted_at: string;
  event: string | null;
  url: string | null;
  target_audience: string | null;
  hook: string | null;
  tags: string[];
  body: string;
  drafts: CfpDrafts | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
function exactKeys(value: Record<string, unknown>, expected: string[]) {
  const actual = Object.keys(value).sort();
  return actual.length === expected.length && actual.every((key, i) => key === expected[i]);
}
function httpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}
function split(source: string) {
  const match = /^---\n([^\n]+)\n---\n([\s\S]*)$/.exec(source);
  if (!match) throw new Error('invalid KB JSON frontmatter');
  let fields: unknown;
  try {
    fields = JSON.parse(match[1]);
  } catch {
    throw new Error('invalid KB JSON frontmatter');
  }
  if (!isRecord(fields)) throw new Error('invalid KB JSON frontmatter');
  return { fields, body: match[2] };
}
function parse(source: string, id: string, draftsSource: string | null): Cfp {
  const { fields, body } = split(source);
  if (
    !exactKeys(fields, [
      'event',
      'hook',
      'status',
      'submitted_at',
      'tags',
      'target_audience',
      'title',
      'url',
    ]) ||
    typeof fields.title !== 'string' ||
    !fields.title.trim() ||
    (fields.status !== null &&
      (typeof fields.status !== 'string' || !statuses.has(fields.status))) ||
    typeof fields.submitted_at !== 'string' ||
    !isoDate.test(fields.submitted_at) ||
    (fields.event !== null && (typeof fields.event !== 'string' || !cfpId.test(fields.event))) ||
    (fields.url !== null && !httpUrl(fields.url)) ||
    (fields.target_audience !== null && typeof fields.target_audience !== 'string') ||
    (fields.hook !== null && typeof fields.hook !== 'string') ||
    !Array.isArray(fields.tags) ||
    fields.tags.some((tag) => typeof tag !== 'string') ||
    !body.trim()
  )
    throw new Error('invalid KB cfp metadata');
  let drafts: CfpDrafts | null = null;
  if (draftsSource !== null) {
    const parsed = split(draftsSource);
    if (
      !exactKeys(parsed.fields, ['title']) ||
      typeof parsed.fields.title !== 'string' ||
      !parsed.fields.title.trim() ||
      !parsed.body.trim()
    )
      throw new Error('invalid KB cfp drafts metadata');
    drafts = { title: parsed.fields.title, body: parsed.body };
  }
  return {
    id,
    title: fields.title,
    status: fields.status as string | null,
    submitted_at: fields.submitted_at,
    event: fields.event as string | null,
    url: fields.url as string | null,
    target_audience: fields.target_audience as string | null,
    hook: fields.hook as string | null,
    tags: fields.tags as string[],
    body,
    drafts,
  };
}
export function cfps(): Cfp[] {
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const id = entry.name;
      if (!cfpId.test(id)) throw new Error('unsafe KB cfp path');
      const drafts = path.join(root, id, 'drafts.md');
      return parse(
        fs.readFileSync(path.join(root, id, 'index.md'), 'utf8'),
        id,
        fs.existsSync(drafts) ? fs.readFileSync(drafts, 'utf8') : null,
      );
    })
    .sort((a, b) => b.id.localeCompare(a.id));
}
export function cfp(id: string): Cfp | null {
  return cfpId.test(id) ? (cfps().find((item) => item.id === id) ?? null) : null;
}
export function cfpsForEvent(eventId: string): Cfp[] {
  return cfps().filter((item) => item.event === eventId);
}
