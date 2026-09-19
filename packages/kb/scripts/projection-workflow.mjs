import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { bundleKey, defaultDestination, projectionFiles, validate } from './import-projection.mjs';
import {
  assertPublicationSource,
  defaultAuthorityPath,
  entryKinds,
  withPublicationAuthority,
} from './publication-authority.mjs';

const receiptKeys = [
  'authority_revision',
  'candidate_tree_digest',
  'projection_revision',
  'schema_version',
  'target_tree_digest',
];
const digest = (value) => crypto.createHash('sha256').update(value, 'utf8').digest('hex');
// ファイルはバイト列で digest する。UTF-8 のテキストだけの候補は従来と同じ値になる。
const fileDigest = (file) =>
  crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const bytes = (content) => (typeof content === 'string' ? Buffer.from(content, 'utf8') : content);
function fail(message) {
  throw new Error(`invalid projection workflow: ${message}`);
}
// 件数の名前は種別ごと。novel の戻り値は既存の呼び出し元が deep-equal で読むので増やさない。
function counts(valid) {
  return entryKinds.has(valid.kind)
    ? { entry_count: valid.entries.length }
    : { chapter_count: valid.chapters.length };
}
function safeChild(root, child) {
  const result = path.resolve(root, child);
  if (!result.startsWith(`${root}${path.sep}`)) fail('path');
  return result;
}
// 種別によっては `<id>/index.md` の入れ子になる。ディレクトリは通し、ファイル以外の実体は拒む。
function fileEntries(root, code) {
  const raw = fs.readdirSync(root, { recursive: true, withFileTypes: true });
  if (raw.some((entry) => !entry.isFile() && !entry.isDirectory())) fail(code);
  return raw
    .filter((entry) => entry.isFile())
    .map((entry) =>
      entry.parentPath ? path.relative(root, path.join(entry.parentPath, entry.name)) : entry.name,
    )
    .map((entry) => entry.split(path.sep).join('/'))
    .sort();
}
function tree(root) {
  if (!fs.existsSync(root)) return null;
  return digest(
    fileEntries(root, 'tree entry')
      .map((entry) => `${entry}\0${fileDigest(safeChild(root, entry))}`)
      .join('\n'),
  );
}
function writeCandidate(files, candidate) {
  fs.mkdirSync(candidate, { recursive: true });
  for (const [file, content] of files) {
    // cfp のように `<id>/index.md` の入れ子を持つ種別があるので、親を先に作る。
    const target = safeChild(candidate, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (typeof content === 'string') fs.writeFileSync(target, content, 'utf8');
    else fs.writeFileSync(target, content);
  }
}
function expectedCandidate(files, candidate) {
  const expected = [...files.keys()].sort();
  const actual = fileEntries(candidate, 'candidate entry');
  if (JSON.stringify(actual) !== JSON.stringify(expected)) fail('candidate files');
  for (const [file, content] of files) {
    if (Buffer.compare(fs.readFileSync(safeChild(candidate, file)), bytes(content)) !== 0) {
      fail('candidate content');
    }
  }
}
function readReceipt(receiptPath) {
  let receipt;
  try {
    receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
  } catch {
    fail('receipt JSON');
  }
  if (
    !receipt ||
    typeof receipt !== 'object' ||
    JSON.stringify(Object.keys(receipt).sort()) !== JSON.stringify(receiptKeys) ||
    receipt.schema_version !== 2 ||
    !/^[a-f0-9]{64}$/.test(receipt.authority_revision) ||
    !/^[a-f0-9]{64}$/.test(receipt.projection_revision) ||
    !/^[a-f0-9]{64}$/.test(receipt.candidate_tree_digest) ||
    (receipt.target_tree_digest !== null && !/^[a-f0-9]{64}$/.test(receipt.target_tree_digest))
  ) {
    fail('receipt');
  }
  return receipt;
}
function replaceTarget(candidate, target) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-projection-apply-'));
  const backup = path.join(temp, 'previous');
  let replaced = false;
  try {
    if (fs.existsSync(target)) fs.renameSync(target, backup);
    fs.renameSync(candidate, target);
    replaced = true;
    fs.rmSync(backup, { recursive: true, force: true });
  } catch (error) {
    if (!replaced && fs.existsSync(backup) && !fs.existsSync(target)) fs.renameSync(backup, target);
    throw error;
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
export function reviewProjection(
  bundle,
  destination,
  reviewRoot,
  authorityPath = defaultAuthorityPath,
) {
  const valid = validate(bundle);
  return withPublicationAuthority(authorityPath, bundleKey(valid), (context) => {
    assertPublicationSource(valid, context);
    const { slug, files } = projectionFiles(bundle);
    const root = path.resolve(destination);
    const reviews = path.resolve(reviewRoot);
    const target = safeChild(root, slug);
    const review = safeChild(reviews, valid.projection_revision);
    const candidateRoot = safeChild(review, 'candidate');
    const candidate = safeChild(candidateRoot, slug);
    if (fs.existsSync(review)) fail('review already exists');
    fs.mkdirSync(review, { recursive: true });
    try {
      writeCandidate(files, candidate);
      const receipt = {
        schema_version: 2,
        authority_revision: context.revision,
        projection_revision: valid.projection_revision,
        candidate_tree_digest: tree(candidate),
        target_tree_digest: tree(target),
      };
      fs.writeFileSync(safeChild(review, 'receipt.json'), `${JSON.stringify(receipt)}\n`, 'utf8');
      return { receipt: safeChild(review, 'receipt.json'), ...counts(valid) };
    } catch (error) {
      fs.rmSync(review, { recursive: true, force: true });
      throw error;
    }
  });
}
export function applyProjection(
  bundle,
  receiptPath,
  destination,
  authorityPath = defaultAuthorityPath,
) {
  const valid = validate(bundle);
  return withPublicationAuthority(authorityPath, bundleKey(valid), (context) => {
    assertPublicationSource(valid, context);
    const { slug, files } = projectionFiles(bundle);
    const root = path.resolve(destination);
    const target = safeChild(root, slug);
    const receipt = readReceipt(path.resolve(receiptPath));
    const review = path.dirname(path.resolve(receiptPath));
    const candidate = safeChild(safeChild(review, 'candidate'), slug);
    if (receipt.authority_revision !== context.revision) fail('authority changed');
    if (receipt.projection_revision !== valid.projection_revision) fail('stale review');
    if (receipt.target_tree_digest !== tree(target)) fail('published target changed');
    expectedCandidate(files, candidate);
    if (receipt.candidate_tree_digest !== tree(candidate)) fail('tampered candidate');
    const noop = receipt.candidate_tree_digest === receipt.target_tree_digest;
    if (!noop) {
      fs.mkdirSync(root, { recursive: true });
      replaceTarget(candidate, target);
    }
    fs.rmSync(review, { recursive: true, force: true });
    return { applied: !noop, ...counts(valid) };
  });
}
if (import.meta.main) {
  const [command, bundlePath, third, fourth, fifth] = Deno.args;
  if (command === 'review' && bundlePath) {
    const parsed = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
    const result = reviewProjection(
      parsed,
      third ?? defaultDestination(parsed),
      fourth ?? '.projection-review',
      fifth ?? defaultAuthorityPath,
    );
    console.log(`review-ready entries=${result.entry_count ?? result.chapter_count}`);
  } else if (command === 'apply' && bundlePath && third) {
    const parsed = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
    const result = applyProjection(
      parsed,
      third,
      fourth ?? defaultDestination(parsed),
      fifth ?? defaultAuthorityPath,
    );
    console.log(
      `apply-${result.applied ? 'updated' : 'no-op'} entries=${result.entry_count ?? result.chapter_count}`,
    );
  } else {
    throw new Error(
      'usage: projection-workflow <review bundle [destination] [review-root] [authority]|apply bundle receipt [destination] [authority]>',
    );
  }
}
