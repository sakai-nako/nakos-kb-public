import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  assertPublicationSource,
  canonical,
  defaultAuthorityPath,
  entryKinds,
  validatePublicationSource,
  withPublicationAuthority,
} from './publication-authority.mjs';

const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const statuses = new Set(['ongoing', 'completed', 'hiatus']);
const heading = /(^|\n)[ \t]*#{1,6}(?:[ \t]|$)/;
const keys = (value) => Object.keys(value).sort();
const equalKeys = (value, expected) =>
  JSON.stringify(keys(value)) === JSON.stringify([...expected].sort());
const digest = (value) =>
  crypto.createHash('sha256').update(canonical(value), 'utf8').digest('hex');
export const eventId = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const platforms = new Set(['docswell', 'speakerdeck', 'slidev', 'other']);
const isoUtc = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const entryKeys = [
  'end_datetime',
  'event_link',
  'event_name',
  'how_relate',
  'id',
  'materials',
  'start_datetime',
];
const materialKeys = ['platform', 'presented_at', 'title', 'url'];
function fail(message) {
  throw new Error(`invalid projection: ${message}`);
}
function safeUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}
function validateEvents(bundle) {
  if (!equalKeys(bundle, ['schema_version', 'kind', 'entries', 'source', 'projection_revision'])) {
    fail('top-level keys');
  }
  if (bundle.schema_version !== 2 || !/^[a-f0-9]{64}$/.test(bundle.projection_revision)) {
    fail('version or revision');
  }
  if (!Array.isArray(bundle.entries)) fail('shape');
  let previousId = '';
  for (const entry of bundle.entries) {
    if (!entry || !equalKeys(entry, entryKeys)) fail('entry keys');
    if (typeof entry.id !== 'string' || !eventId.test(entry.id)) fail('entry id');
    if (entry.id <= previousId) fail(previousId === entry.id ? 'entry id' : 'entries order');
    previousId = entry.id;
    if (typeof entry.event_name !== 'string' || !entry.event_name.trim()) fail('event_name');
    for (const key of ['start_datetime', 'end_datetime']) {
      if (
        typeof entry[key] !== 'string' ||
        !isoUtc.test(entry[key]) ||
        Number.isNaN(Date.parse(entry[key]))
      ) {
        fail('datetime');
      }
    }
    if (Date.parse(entry.end_datetime) < Date.parse(entry.start_datetime)) fail('datetime');
    if (entry.event_link !== null && !safeUrl(entry.event_link)) fail('url');
    if (
      !Array.isArray(entry.how_relate) ||
      entry.how_relate.some((value) => typeof value !== 'string' || !/^[a-z_]+$/.test(value))
    ) {
      fail('how_relate');
    }
    if (!Array.isArray(entry.materials)) fail('material');
    for (const material of entry.materials) {
      if (
        !material ||
        !equalKeys(material, materialKeys) ||
        typeof material.title !== 'string' ||
        !material.title.trim() ||
        !safeUrl(material.url) ||
        (material.platform !== null && !platforms.has(material.platform)) ||
        (material.presented_at !== null &&
          (typeof material.presented_at !== 'string' || !material.presented_at.trim()))
      ) {
        fail('material');
      }
    }
  }
  const unsigned = {
    schema_version: 2,
    kind: 'events',
    entries: bundle.entries,
    source: bundle.source,
  };
  if (digest(unsigned) !== bundle.projection_revision) fail('revision');
  validatePublicationSource(bundle);
  return { ...bundle };
}
export const cfpStatuses = new Set(['submitted', 'accepted', 'rejected', 'withdrawn']);
const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const cfpKeys = [
  'body',
  'drafts',
  'event',
  'hook',
  'id',
  'status',
  'submitted_at',
  'tags',
  'target_audience',
  'title',
  'url',
];
const optionalText = (value) =>
  value === null || (typeof value === 'string' && value.trim() !== '');
function validateCfp(bundle) {
  if (!equalKeys(bundle, ['schema_version', 'kind', 'entries', 'source', 'projection_revision'])) {
    fail('top-level keys');
  }
  if (bundle.schema_version !== 2 || !/^[a-f0-9]{64}$/.test(bundle.projection_revision)) {
    fail('version or revision');
  }
  if (!Array.isArray(bundle.entries)) fail('shape');
  let previousId = '';
  for (const entry of bundle.entries) {
    if (!entry || !equalKeys(entry, cfpKeys)) fail('entry keys');
    if (typeof entry.id !== 'string' || !eventId.test(entry.id)) fail('entry id');
    if (entry.id <= previousId) fail(previousId === entry.id ? 'entry id' : 'entries order');
    previousId = entry.id;
    if (typeof entry.title !== 'string' || !entry.title.trim()) fail('title');
    if (entry.status !== null && !cfpStatuses.has(entry.status)) fail('status');
    if (
      typeof entry.submitted_at !== 'string' ||
      !isoDate.test(entry.submitted_at) ||
      Number.isNaN(Date.parse(entry.submitted_at))
    ) {
      fail('submitted_at');
    }
    if (entry.event !== null && (typeof entry.event !== 'string' || !eventId.test(entry.event))) {
      fail('event');
    }
    if (entry.url !== null && !safeUrl(entry.url)) fail('url');
    if (!optionalText(entry.target_audience) || !optionalText(entry.hook)) fail('text');
    if (
      !Array.isArray(entry.tags) ||
      entry.tags.some((tag) => typeof tag !== 'string' || !tag.trim())
    ) {
      fail('tags');
    }
    if (typeof entry.body !== 'string' || !entry.body.trim()) fail('body');
    if (entry.drafts !== null) {
      if (
        !entry.drafts ||
        !equalKeys(entry.drafts, ['body', 'title']) ||
        typeof entry.drafts.title !== 'string' ||
        !entry.drafts.title.trim() ||
        typeof entry.drafts.body !== 'string' ||
        !entry.drafts.body.trim()
      ) {
        fail('drafts');
      }
    }
  }
  const unsigned = {
    schema_version: 2,
    kind: 'cfp',
    entries: bundle.entries,
    source: bundle.source,
  };
  if (digest(unsigned) !== bundle.projection_revision) fail('revision');
  validatePublicationSource(bundle);
  return { ...bundle };
}
// 旧サイトの記事 id は日付始まりだが、events と違い日付を必須にしない。
// exporter がファイル名から起こす id を同じ規則で弾けるように公開する。
export const blogId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const blogKeys = ['body', 'description', 'id', 'pubDate', 'tags', 'title'];
function validateBlog(bundle) {
  if (!equalKeys(bundle, ['schema_version', 'kind', 'entries', 'source', 'projection_revision'])) {
    fail('top-level keys');
  }
  if (bundle.schema_version !== 2 || !/^[a-f0-9]{64}$/.test(bundle.projection_revision)) {
    fail('version or revision');
  }
  if (!Array.isArray(bundle.entries)) fail('shape');
  let previousId = '';
  for (const entry of bundle.entries) {
    if (!entry || !equalKeys(entry, blogKeys)) fail('entry keys');
    if (typeof entry.id !== 'string' || !blogId.test(entry.id)) fail('entry id');
    if (entry.id <= previousId) fail(previousId === entry.id ? 'entry id' : 'entries order');
    previousId = entry.id;
    if (typeof entry.title !== 'string' || !entry.title.trim()) fail('title');
    if (typeof entry.description !== 'string' || !entry.description.trim()) fail('description');
    if (
      typeof entry.pubDate !== 'string' ||
      !isoDate.test(entry.pubDate) ||
      Number.isNaN(Date.parse(entry.pubDate))
    ) {
      fail('pubDate');
    }
    if (
      !Array.isArray(entry.tags) ||
      entry.tags.some((tag) => typeof tag !== 'string' || !tag.trim())
    ) {
      fail('tags');
    }
    if (typeof entry.body !== 'string' || !entry.body.trim()) fail('body');
  }
  const unsigned = {
    schema_version: 2,
    kind: 'blog',
    entries: bundle.entries,
    source: bundle.source,
  };
  if (digest(unsigned) !== bundle.projection_revision) fail('revision');
  validatePublicationSource(bundle);
  return { ...bundle };
}
const slidesEntryKeys = ['files', 'id', 'meta'];
const slidesMetaKeys = ['event', 'eventDate', 'eventName', 'title'];
const slidesFileKeys = ['content', 'encoding', 'path', 'sha256'];
// 共有部品の配布物 (ビルド時に各デッキへ配る) と kb が足す meta.json は bundle から来ない。
// exporter が Vault の走査で同じ名前を読み飛ばせるように公開する。
export const slidesReserved = new Set([
  'components',
  'slide-images',
  'global-bottom.vue',
  'vite.config.ts',
  'meta.json',
]);
// path 全体では `/^[a-z0-9][a-z0-9._/-]*$/`。要素ごとに見て `..` と `_` 始まりも同時に弾く。
const slidesSegment = /^[a-z0-9][a-z0-9._-]*$/;
const bytesDigest = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
export function slidesPath(value) {
  if (typeof value !== 'string' || !value) return false;
  return value
    .split('/')
    .every((segment) => slidesSegment.test(segment) && !slidesReserved.has(segment));
}
export function decodeSlidesFile(file) {
  if (file.encoding !== 'base64') return Buffer.from(file.content, 'utf8');
  const bytes = Buffer.from(file.content, 'base64');
  // 復号して符号化し直すと戻る base64 だけを受ける (詰め物や空白を含む表現を拒む)。
  if (bytes.toString('base64') !== file.content) fail('file content');
  return bytes;
}
function validateSlides(bundle) {
  if (!equalKeys(bundle, ['schema_version', 'kind', 'entries', 'source', 'projection_revision'])) {
    fail('top-level keys');
  }
  if (bundle.schema_version !== 2 || !/^[a-f0-9]{64}$/.test(bundle.projection_revision)) {
    fail('version or revision');
  }
  if (!Array.isArray(bundle.entries)) fail('shape');
  let previousId = '';
  for (const entry of bundle.entries) {
    if (!entry || !equalKeys(entry, slidesEntryKeys)) fail('entry keys');
    if (typeof entry.id !== 'string' || !eventId.test(entry.id)) fail('entry id');
    if (entry.id <= previousId) fail(previousId === entry.id ? 'entry id' : 'entries order');
    previousId = entry.id;
    const meta = entry.meta;
    if (!meta || !equalKeys(meta, slidesMetaKeys)) fail('meta keys');
    if (typeof meta.title !== 'string' || !meta.title.trim()) fail('meta title');
    if (meta.event !== null && (typeof meta.event !== 'string' || !eventId.test(meta.event))) {
      fail('meta event');
    }
    if (!optionalText(meta.eventName)) fail('meta eventName');
    if (
      meta.eventDate !== null &&
      (typeof meta.eventDate !== 'string' ||
        !isoDate.test(meta.eventDate) ||
        Number.isNaN(Date.parse(meta.eventDate)))
    ) {
      fail('meta eventDate');
    }
    if (!Array.isArray(entry.files) || !entry.files.length) fail('files');
    let previousPath = '';
    let hasIndex = false;
    for (const file of entry.files) {
      if (!file || !equalKeys(file, slidesFileKeys)) fail('file keys');
      if (!slidesPath(file.path)) fail('file path');
      if (file.path <= previousPath) fail('files order');
      previousPath = file.path;
      if (!['utf8', 'base64'].includes(file.encoding) || typeof file.content !== 'string') {
        fail('file encoding');
      }
      const bytes = decodeSlidesFile(file);
      if (typeof file.sha256 !== 'string' || bytesDigest(bytes) !== file.sha256)
        fail('file digest');
      if (file.path === 'index.md') {
        // Slidev の frontmatter は index.md の先頭にある。YAML の中身は exporter が検証する。
        if (file.encoding !== 'utf8' || !file.content.startsWith('---\n')) fail('index.md');
        hasIndex = true;
      }
    }
    if (!hasIndex) fail('index.md missing');
  }
  const unsigned = {
    schema_version: 2,
    kind: 'slides',
    entries: bundle.entries,
    source: bundle.source,
  };
  if (digest(unsigned) !== bundle.projection_revision) fail('revision');
  validatePublicationSource(bundle);
  return { ...bundle };
}
// entryKinds (events / cfp / blog / slides) と 1 対 1。`kind` 無しの bundle は novel として読む。
const validators = {
  events: validateEvents,
  cfp: validateCfp,
  blog: validateBlog,
  slides: validateSlides,
};
export function validate(bundle) {
  if (!bundle || typeof bundle !== 'object') fail('top-level keys');
  if (Object.hasOwn(bundle, 'kind')) {
    if (!entryKinds.has(bundle.kind)) fail('kind');
    return validators[bundle.kind](bundle);
  }
  return validateNovel(bundle);
}
export function bundleKey(valid) {
  return entryKinds.has(valid.kind) ? valid.kind : valid.novel.slug;
}
export function defaultDestination(bundle) {
  return entryKinds.has(bundle?.kind) ? 'src/content' : 'src/content/novels';
}
function validateNovel(bundle) {
  if (
    !bundle ||
    typeof bundle !== 'object' ||
    !equalKeys(
      bundle,
      bundle.schema_version === 2
        ? ['schema_version', 'projection_revision', 'novel', 'chapters', 'source']
        : ['schema_version', 'projection_revision', 'novel', 'chapters'],
    )
  ) {
    fail('top-level keys');
  }
  if (
    ![1, 2].includes(bundle.schema_version) ||
    !/^[a-f0-9]{64}$/.test(bundle.projection_revision)
  ) {
    fail('version or revision');
  }
  if (
    !bundle.novel ||
    !equalKeys(bundle.novel, ['title', 'slug', 'status', 'synopsis']) ||
    !bundle.chapters ||
    !Array.isArray(bundle.chapters)
  ) {
    fail('shape');
  }
  if (
    ![bundle.novel.title, bundle.novel.slug, bundle.novel.status, bundle.novel.synopsis].every(
      (value) => typeof value === 'string',
    ) ||
    !slug.test(bundle.novel.slug) ||
    !bundle.novel.title.trim() ||
    !statuses.has(bundle.novel.status)
  ) {
    fail('novel');
  }
  const seen = new Set();
  const chapterSlugs = new Set();
  for (const chapter of bundle.chapters) {
    if (
      !chapter ||
      !equalKeys(chapter, ['title', 'slug', 'sequence', 'body']) ||
      typeof chapter.title !== 'string' ||
      typeof chapter.body !== 'string' ||
      !slug.test(chapter.slug) ||
      !chapter.title.trim() ||
      !chapter.body ||
      !Number.isInteger(chapter.sequence) ||
      chapter.sequence <= 0 ||
      seen.has(chapter.sequence) ||
      chapterSlugs.has(chapter.slug) ||
      heading.test(chapter.body)
    ) {
      fail('chapter');
    }
    seen.add(chapter.sequence);
    chapterSlugs.add(chapter.slug);
  }
  const unsigned = {
    schema_version: bundle.schema_version,
    novel: bundle.novel,
    chapters: bundle.chapters,
    ...(bundle.schema_version === 2 ? { source: bundle.source } : {}),
  };
  if (digest(unsigned) !== bundle.projection_revision) fail('revision');
  if (bundle.schema_version === 2) validatePublicationSource(bundle);
  return { ...bundle, chapters: [...bundle.chapters].sort((a, b) => a.sequence - b.sequence) };
}
function frontmatter(metadata) {
  return `---\n${canonical(metadata)}\n---\n`;
}
export function projectionFiles(bundle) {
  const valid = validate(bundle);
  if (valid.kind === 'events') {
    return {
      slug: 'events',
      files: new Map(valid.entries.map(({ id, ...rest }) => [`${id}.md`, frontmatter(rest)])),
    };
  }
  if (valid.kind === 'cfp') {
    const files = new Map();
    for (const { id, body, drafts, ...meta } of valid.entries) {
      files.set(`${id}/index.md`, `${frontmatter(meta)}${body}`);
      if (drafts)
        files.set(`${id}/drafts.md`, `${frontmatter({ title: drafts.title })}${drafts.body}`);
    }
    return { slug: 'cfp', files };
  }
  if (valid.kind === 'blog') {
    return {
      slug: 'blog',
      files: new Map(
        valid.entries.map(({ id, body, ...meta }) => [`${id}.md`, `${frontmatter(meta)}${body}`]),
      ),
    };
  }
  if (valid.kind === 'slides') {
    const files = new Map();
    for (const entry of valid.entries) {
      for (const file of entry.files) {
        // テキストはそのまま、base64 はバイト列で置く (Slidev がデッキごと読む)。
        files.set(
          `${entry.id}/${file.path}`,
          file.encoding === 'base64' ? decodeSlidesFile(file) : file.content,
        );
      }
      // kb の loader が読むのは meta.json だけで、index.md の YAML は読まない。
      files.set(`${entry.id}/meta.json`, `${canonical(entry.meta)}\n`);
    }
    return { slug: 'slides', files };
  }
  return {
    slug: valid.novel.slug,
    files: new Map([
      [
        'index.md',
        frontmatter({
          title: valid.novel.title,
          status: valid.novel.status,
          synopsis: valid.novel.synopsis,
        }),
      ],
      ...valid.chapters.map((chapter) => [
        `${String(chapter.sequence).padStart(2, '0')}-${chapter.slug}.md`,
        `${frontmatter({
          title: chapter.title,
          slug: chapter.slug,
          sequence: chapter.sequence,
        })}${chapter.body}`,
      ]),
    ]),
  };
}
function writeProjection(files, directory) {
  fs.mkdirSync(directory, { recursive: true });
  for (const [file, content] of files) {
    const target = path.join(directory, file);
    if (!target.startsWith(`${path.resolve(directory)}${path.sep}`)) fail('path');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    // slides は画像を持つので、文字列だけをテキストとして書き、バイト列はそのまま書く。
    if (typeof content === 'string') fs.writeFileSync(target, content, 'utf8');
    else fs.writeFileSync(target, content);
  }
}
export function importProjection(bundle, destination, authorityPath = defaultAuthorityPath) {
  const valid = validate(bundle);
  return withPublicationAuthority(authorityPath, bundleKey(valid), (context) => {
    assertPublicationSource(valid, context);
    const { slug: projectionSlug, files } = projectionFiles(bundle);
    const root = path.resolve(destination);
    const target = path.join(root, projectionSlug);
    if (!target.startsWith(`${root}${path.sep}`)) fail('path');
    fs.mkdirSync(root, { recursive: true });
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-projection-'));
    try {
      const staged = path.join(temp, projectionSlug);
      writeProjection(files, staged);
      const backup = `${target}.previous`;
      fs.rmSync(backup, { recursive: true, force: true });
      if (fs.existsSync(target)) fs.renameSync(target, backup);
      fs.renameSync(staged, target);
      fs.rmSync(backup, { recursive: true, force: true });
    } finally {
      fs.rmSync(temp, { recursive: true, force: true });
    }
  });
}
if (import.meta.main) {
  const source = Deno.args[0];
  if (!source) throw new Error('usage: import-projection <bundle.json> [destination] [authority]');
  const bundle = JSON.parse(fs.readFileSync(source, 'utf8'));
  importProjection(
    bundle,
    Deno.args[1] ?? defaultDestination(bundle),
    Deno.args[2] ?? defaultAuthorityPath,
  );
}
