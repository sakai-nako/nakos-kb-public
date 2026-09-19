import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const hash = /^[a-f0-9]{64}$/;
const registryKeys = ['schema_version', 'works'];
const workKeys = ['generation', 'kind', 'state', 'work_id'];

export const defaultAuthorityPath = path.resolve(
  fileURLToPath(new URL('../publication-authority.json', import.meta.url)),
);

export function canonical(value) {
  return Array.isArray(value)
    ? `[${value.map(canonical).join(',')}]`
    : value && typeof value === 'object'
      ? `{${Object.keys(value)
          .sort()
          .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
          .join(',')}}`
      : JSON.stringify(value);
}
export function revision(value) {
  return crypto.createHash('sha256').update(canonical(value), 'utf8').digest('hex');
}
function fail(message) {
  throw new Error(`invalid publication authority: ${message}`);
}
function equalKeys(value, expected) {
  return (
    value &&
    typeof value === 'object' &&
    JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort())
  );
}
function plainObject(value) {
  return value && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}
function checkedAuthorityPath(authorityPath) {
  const resolved = path.resolve(authorityPath);
  const parsed = path.parse(resolved);
  let current = parsed.root;
  let finalStat;
  for (const part of resolved.slice(parsed.root.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    let stat;
    try {
      stat = fs.lstatSync(current);
    } catch {
      fail('missing registry');
    }
    if (stat.isSymbolicLink() || (!stat.isDirectory() && current !== resolved)) {
      fail('registry path');
    }
    if (current === resolved) {
      if (!stat.isFile() || stat.nlink !== 1) fail('registry path');
      finalStat = stat;
    }
  }
  if (!finalStat) fail('registry path');
  return resolved;
}
function readAuthority(authorityPath) {
  const resolved = checkedAuthorityPath(authorityPath);
  let registry;
  try {
    registry = JSON.parse(fs.readFileSync(resolved, 'utf8'));
  } catch {
    fail('registry JSON');
  }
  if (
    !plainObject(registry) ||
    !equalKeys(registry, registryKeys) ||
    registry.schema_version !== 1 ||
    !plainObject(registry.works)
  ) {
    fail('registry shape');
  }
  for (const [key, value] of Object.entries(registry.works)) {
    const entry = value;
    if (
      !slug.test(key) ||
      !plainObject(entry) ||
      !equalKeys(entry, workKeys) ||
      !uuid.test(entry.work_id) ||
      !uuid.test(entry.generation) ||
      !['db', 'vault'].includes(entry.kind) ||
      !['active', 'frozen'].includes(entry.state)
    ) {
      fail('work entry');
    }
  }
  return { path: resolved, registry, revision: revision(registry) };
}
function withLock(authorityPath, callback) {
  const lock = `${path.resolve(authorityPath)}.lock`;
  try {
    fs.mkdirSync(lock);
  } catch (error) {
    if (error?.code === 'EEXIST') fail('lock held');
    throw error;
  }
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    try {
      fs.rmdirSync(lock);
    } catch (error) {
      if (error?.code === 'ENOTEMPTY') fail('lock modified');
      throw error;
    }
  };
  try {
    const result = callback();
    if (result && typeof result.then === 'function') return result.finally(release);
    release();
    return result;
  } catch (error) {
    release();
    throw error;
  }
}
export function withPublicationAuthority(authorityPath, workSlug, callback) {
  if (!slug.test(workSlug)) fail('work slug');
  const checked = readAuthority(authorityPath);
  return withLock(checked.path, () => {
    const authority = readAuthority(checked.path);
    return callback({
      revision: authority.revision,
      entry: Object.hasOwn(authority.registry.works, workSlug)
        ? authority.registry.works[workSlug]
        : null,
    });
  });
}
export function snapshotRevision(novel, chapters) {
  return revision({ novel, chapters: [...chapters].sort((a, b) => a.sequence - b.sequence) });
}
// `kind` を持つ bundle の種別。novel だけが `kind` 無しで、entries ではなく chapters を持つ。
export const entryKinds = new Set(['events', 'cfp', 'blog', 'slides']);
export function snapshotRevisionOf(bundle) {
  if (entryKinds.has(bundle.kind)) return revision({ kind: bundle.kind, entries: bundle.entries });
  return snapshotRevision(bundle.novel, bundle.chapters);
}
export function validatePublicationSource(bundle) {
  if (bundle.schema_version === 1) return;
  const source = bundle.source;
  if (
    !source ||
    !equalKeys(source, ['generation', 'kind', 'snapshot_revision', 'work_id']) ||
    !['db', 'vault'].includes(source.kind) ||
    !uuid.test(source.work_id) ||
    !uuid.test(source.generation) ||
    !hash.test(source.snapshot_revision) ||
    source.snapshot_revision !== snapshotRevisionOf(bundle)
  ) {
    fail('bundle source');
  }
}
export function assertPublicationSource(bundle, context) {
  if (bundle.schema_version === 1) {
    if (context.entry) fail('legacy bundle for registered work');
    return;
  }
  validatePublicationSource(bundle);
  const source = bundle.source;
  if (!context.entry) fail('unregistered bundle source');
  if (context.entry.state !== 'active') fail('work frozen');
  if (
    context.entry.kind !== source.kind ||
    context.entry.work_id !== source.work_id ||
    context.entry.generation !== source.generation
  ) {
    fail('bundle source mismatch');
  }
}
function writeAuthority(authorityPath, registry) {
  const resolved = path.resolve(authorityPath);
  const temp = `${resolved}.${crypto.randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temp, `${JSON.stringify(registry)}\n`, { encoding: 'utf8', flag: 'wx' });
    fs.renameSync(temp, resolved);
  } finally {
    if (fs.existsSync(temp)) fs.rmSync(temp, { force: true });
  }
}
export function registerWork(authorityPath, workSlug, workId, kind) {
  if (!slug.test(workSlug) || !uuid.test(workId) || !['db', 'vault'].includes(kind)) {
    fail('register arguments');
  }
  const checked = readAuthority(authorityPath);
  return withLock(checked.path, () => {
    const authority = readAuthority(checked.path);
    if (Object.hasOwn(authority.registry.works, workSlug)) fail('work already registered');
    const registry = structuredClone(authority.registry);
    registry.works[workSlug] = {
      work_id: workId,
      kind,
      generation: crypto.randomUUID(),
      state: 'active',
    };
    writeAuthority(authority.path, registry);
    return revision(registry);
  });
}
export function freezeWork(authorityPath, workSlug) {
  return updateWork(authorityPath, workSlug, (entry) => ({ ...entry, state: 'frozen' }));
}
export function activateWork(authorityPath, workSlug, kind) {
  if (!['db', 'vault'].includes(kind)) fail('activate arguments');
  return updateWork(authorityPath, workSlug, (entry) => ({
    ...entry,
    kind,
    generation: crypto.randomUUID(),
    state: 'active',
  }));
}
function updateWork(authorityPath, workSlug, update) {
  if (!slug.test(workSlug)) fail('work slug');
  const checked = readAuthority(authorityPath);
  return withLock(checked.path, () => {
    const authority = readAuthority(checked.path);
    if (!Object.hasOwn(authority.registry.works, workSlug)) fail('unregistered work');
    const registry = structuredClone(authority.registry);
    registry.works[workSlug] = update(registry.works[workSlug]);
    writeAuthority(authority.path, registry);
    return revision(registry);
  });
}

if (import.meta.main) {
  const [command, authorityPath, workSlug, fourth, fifth] = Deno.args;
  let result;
  if (command === 'register') result = registerWork(authorityPath, workSlug, fourth, fifth);
  else if (command === 'freeze') result = freezeWork(authorityPath, workSlug);
  else if (command === 'activate') result = activateWork(authorityPath, workSlug, fourth);
  else {
    throw new Error(
      'usage: publication-authority <register authority.json slug work-id db|vault|freeze authority.json slug|activate authority.json slug db|vault>',
    );
  }
  console.log(`authority-revision=${result}`);
}
