import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { run } from '../../../../../scripts/runtime/process.ts';
import { defaultDestination } from './import-projection.mjs';

const kb = fileURLToPath(new URL('../', import.meta.url));
const root = resolve(kb, '../../../..');
// 投影先は bundle の種別で決まる。判定は importer の defaultDestination だけが持つ
// (ここに種別を並べ直すと、新しい種別で片方だけ更新し忘れて投影先がずれる)。
const destinationFor = (bundlePath: string) =>
  defaultDestination(JSON.parse(readFileSync(resolve(kb, bundlePath), 'utf8')));
export async function main([task, ...args]: string[], execute: typeof run = run): Promise<number> {
  const deno = (argv: string[]) => execute({ command: Deno.execPath(), args: argv, cwd: kb });
  if (task === 'build' || task === 'test' || task === 'e2e') return deno(['task', task, ...args]);
  if (task === 'smoke') return deno(['run', '-A', 'scripts/deployment-smoke.ts', ...args]);
  if (task === 'projection-review')
    return deno([
      'run',
      '-A',
      'scripts/projection-workflow.mjs',
      'review',
      args[0],
      destinationFor(args[0]),
      args[1],
    ]);
  if (task === 'projection-apply')
    return deno([
      'run',
      '-A',
      'scripts/projection-workflow.mjs',
      'apply',
      args[0],
      args[1],
      destinationFor(args[0]),
    ]);
  if (task.startsWith('authority-'))
    return deno([
      'run',
      '-A',
      'scripts/publication-authority.mjs',
      task.slice(10),
      'publication-authority.json',
      ...args,
    ]);
  if (task === 'release-prep') return deno(['run', '-A', 'scripts/release-prep.ts']);
  if (task === 'ship') return deno(['run', '-A', resolve(root, 'scripts/ship.ts'), 'kb', ...args]);
  throw new Error(`Unknown KB task: ${task}`);
}
if (import.meta.main) Deno.exit(await main(Deno.args));
