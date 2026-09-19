import assert from 'node:assert/strict';
import { releasePrepOptions } from './release-prep.ts';

Deno.test('KB release follows personal UI and root locks while retaining runtime identifiers', () => {
  const options = releasePrepOptions();
  assert.equal(options.component, 'kb');
  assert.equal(options.registryPath, 'sakai-nako/personal-monorepo/kb');
  assert.deepEqual(options.paths, ['.', '../ui', '../../../../deno.lock', '../../../../deno.json']);
  assert.match(options.valuesPath.replaceAll('\\', '/'), /\/infra\/k8s\/apps\/kb\/values\.yaml$/);
});
