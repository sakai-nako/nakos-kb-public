import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { run } from '../../../../../scripts/runtime/process.ts';
import { defaultDestination } from './import-projection.mjs';

const kb = fileURLToPath(new URL('../', import.meta.url));
// 投影先は bundle の種別で決まる。判定は importer の defaultDestination だけが持つ
// (ここに種別を並べ直すと、新しい種別で片方だけ更新し忘れて投影先がずれる)。
const destinationFor = (bundlePath: string) =>
  defaultDestination(JSON.parse(readFileSync(resolve(kb, bundlePath), 'utf8')));
export async function main([task, ...args]: string[], execute: typeof run = run): Promise<number> {
  const deno = (argv: string[]) => execute({ command: Deno.execPath(), args: argv, cwd: kb });
  if (task === 'build' || task === 'test' || task === 'e2e') return deno(['task', task, ...args]);
  // 検証用 build。6 種別すべての入力を tests/fixtures/ に固定する (公開データは build-release 側)。
  if (task === 'build-validation') {
    const fixture = (name: string) => resolve(kb, 'tests/fixtures', name);
    const env = {
      KB_CONTENT_ROOT: fixture('novels'),
      KB_ABOUT_CONTENT_ROOT: fixture('about'),
      KB_EVENTS_CONTENT_ROOT: fixture('events'),
      KB_CFP_CONTENT_ROOT: fixture('cfp'),
      KB_BLOG_CONTENT_ROOT: fixture('blog'),
      KB_SLIDES_CONTENT_ROOT: fixture('slides'),
      KB_SLIDES_OUT: resolve(kb, 'dist/slides'),
    };
    const tested = await execute({ command: Deno.execPath(), args: ['task', 'test'], cwd: kb });
    if (tested) return tested;
    for (const argv of [
      ['run', '-A', 'npm:astro@7.2.2', 'build'],
      ['run', '-A', 'scripts/build-slides.mjs'],
    ]) {
      const code = await execute({ command: Deno.execPath(), args: argv, cwd: kb, env });
      if (code) return code;
    }
    return 0;
  }
  // 配布用の dist。入力はコミット済みの公開投影だけで、テストの fixture は混ぜない
  // (CI の kb-image job が docker build の前に呼ぶ)。
  if (task === 'build-release') {
    const content = (name: string) => resolve(kb, 'src/content', name);
    const env = {
      KB_CONTENT_ROOT: content('novels'),
      KB_ABOUT_CONTENT_ROOT: content('about'),
      KB_EVENTS_CONTENT_ROOT: content('events'),
      KB_CFP_CONTENT_ROOT: content('cfp'),
      KB_BLOG_CONTENT_ROOT: content('blog'),
      KB_SLIDES_CONTENT_ROOT: content('slides'),
      KB_SLIDES_OUT: resolve(kb, 'dist/slides'),
    };
    // workspace の依存は repo root で入れる (kb の build が @personal/ui を読む)。
    const installed = await execute({
      command: Deno.execPath(),
      args: ['install', '--frozen'],
      cwd: resolve(kb, '../../../..'),
    });
    if (installed) return installed;
    for (const argv of [
      ['run', '-A', 'npm:astro@7.2.2', 'build'],
      // Slidev のデッキは Astro の dist に並置する (投影が無ければ何もしない)。
      ['run', '-A', 'scripts/build-slides.mjs'],
    ]) {
      const code = await execute({ command: Deno.execPath(), args: argv, cwd: kb, env });
      if (code) return code;
    }
    return 0;
  }
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
  throw new Error(`Unknown KB task: ${task}`);
}
if (import.meta.main) Deno.exit(await main(Deno.args));
