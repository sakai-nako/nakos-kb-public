import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deploymentLayout } from '../../../../../scripts/runtime/deployment-layout.ts';

const repoRoot = fileURLToPath(new URL('../../../../../', import.meta.url));

import { type PrepareOptions, prepareRelease } from '../../../../../scripts/runtime/release.ts';
export function releasePrepOptions(): PrepareOptions {
  return {
    component: 'kb',
    scriptDir: fileURLToPath(new URL('../', import.meta.url)),
    paths: ['.', '../ui', '../../../../deno.lock', '../../../../deno.json'],
    registryPath: 'sakai-nako/personal-monorepo/kb',
    valuesPath: join(repoRoot, deploymentLayout('kb').valuesFiles[0]),
  };
}
export async function main() {
  const result = await prepareRelease(releasePrepOptions());
  console.log(
    '[release-prep]',
    result.component,
    result.tag,
    result.changed ? 'updated' : 'unchanged',
  );
}
if (import.meta.main) await main();
