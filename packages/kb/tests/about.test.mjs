import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, 'fixtures/about-snapshot');

test('keeps the synthetic About snapshot byte-exact and records its source commit', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, '.snapshot.json'), 'utf8'));
  assert.match(manifest.sourceCommit, /^[0-9a-f]{40}$/);
  assert.equal(manifest.files.length, 3);
  for (const file of manifest.files) {
    assert.match(file.file, /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/);
    const bytes = fs.readFileSync(path.join(root, file.file));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), file.sha256);
    const source = bytes.toString('utf8');
    assert.match(source, /^---\n[\s\S]*?\n---\n/);
    assert.doesNotMatch(source, /^draft:\s*true\s*$/im);
    assert.doesNotMatch(source, /<script\b|javascript:/i);
  }
});
