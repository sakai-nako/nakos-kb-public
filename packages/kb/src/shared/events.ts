import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.env.KB_EVENTS_CONTENT_ROOT ?? 'src/content/events');
const eventId = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isoUtc = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const platforms = new Set(['docswell', 'speakerdeck', 'slidev', 'other']);

export type Material = {
  title: string;
  url: string;
  platform: string | null;
  presented_at: string | null;
};
export type Event = {
  id: string;
  event_name: string;
  start_datetime: string;
  end_datetime: string;
  event_link: string | null;
  how_relate: string[];
  materials: Material[];
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
function parse(source: string, id: string): Event {
  const match = /^---\n([^\n]+)\n---\n([\s\S]*)$/.exec(source);
  if (!match) throw new Error('invalid KB JSON frontmatter');
  let fields: unknown;
  try {
    fields = JSON.parse(match[1]);
  } catch {
    throw new Error('invalid KB JSON frontmatter');
  }
  if (
    !isRecord(fields) ||
    !exactKeys(fields, [
      'end_datetime',
      'event_link',
      'event_name',
      'how_relate',
      'materials',
      'start_datetime',
    ]) ||
    typeof fields.event_name !== 'string' ||
    !fields.event_name.trim() ||
    typeof fields.start_datetime !== 'string' ||
    !isoUtc.test(fields.start_datetime) ||
    typeof fields.end_datetime !== 'string' ||
    !isoUtc.test(fields.end_datetime) ||
    (fields.event_link !== null && !httpUrl(fields.event_link)) ||
    !Array.isArray(fields.how_relate) ||
    fields.how_relate.some((value) => typeof value !== 'string' || !/^[a-z_]+$/.test(value)) ||
    !Array.isArray(fields.materials)
  )
    throw new Error('invalid KB event metadata');
  const materials = fields.materials.map((material): Material => {
    if (
      !isRecord(material) ||
      !exactKeys(material, ['platform', 'presented_at', 'title', 'url']) ||
      typeof material.title !== 'string' ||
      !material.title.trim() ||
      !httpUrl(material.url) ||
      (material.platform !== null &&
        (typeof material.platform !== 'string' || !platforms.has(material.platform))) ||
      (material.presented_at !== null && typeof material.presented_at !== 'string')
    )
      throw new Error('invalid KB event material');
    return {
      title: material.title,
      url: material.url,
      platform: material.platform as string | null,
      presented_at: material.presented_at as string | null,
    };
  });
  return {
    id,
    event_name: fields.event_name,
    start_datetime: fields.start_datetime,
    end_datetime: fields.end_datetime,
    event_link: fields.event_link as string | null,
    how_relate: fields.how_relate as string[],
    materials,
  };
}
export function events(): Event[] {
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => {
      const id = path.basename(entry.name, '.md');
      if (!eventId.test(id)) throw new Error('unsafe KB event path');
      return parse(fs.readFileSync(path.join(root, entry.name), 'utf8'), id);
    })
    .sort(
      (a, b) =>
        Date.parse(b.start_datetime) - Date.parse(a.start_datetime) || b.id.localeCompare(a.id),
    );
}
export function event(id: string): Event | null {
  return eventId.test(id) ? (events().find((item) => item.id === id) ?? null) : null;
}
export function formatJst(iso: string, style: 'date' | 'datetime' | 'time') {
  const date = new Date(iso);
  const base = { timeZone: 'Asia/Tokyo' } as const;
  if (style === 'time')
    return date.toLocaleTimeString('ja-JP', { ...base, hour: '2-digit', minute: '2-digit' });
  if (style === 'date')
    return date.toLocaleDateString('ja-JP', {
      ...base,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  return date.toLocaleString('ja-JP', {
    ...base,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
