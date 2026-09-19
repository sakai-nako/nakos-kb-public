import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultDestination } from '../scripts/import-projection.mjs';
import { entryKinds } from '../scripts/publication-authority.mjs';

// 投影先の判定は defaultDestination だけが持つ。種別を足したときに片方だけ更新して
// 投影先がずれるのを防ぐため、既知の種別を数え上げて確認する。
test('routes every entry kind to src/content and novels to their own root', () => {
  assert.deepEqual([...entryKinds].sort(), ['blog', 'cfp', 'events', 'slides']);
  for (const kind of entryKinds) {
    assert.equal(defaultDestination({ schema_version: 2, kind }), 'src/content');
  }
  assert.equal(defaultDestination({ schema_version: 1 }), 'src/content/novels');
  assert.equal(
    defaultDestination({ schema_version: 2, novel: { slug: 'work' } }),
    'src/content/novels',
  );
});
