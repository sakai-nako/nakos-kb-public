#!/usr/bin/env node
/**
 * 発表リハ用シミュレーション動画ビルドスクリプト（差分ビルド対応）
 *
 * src/content/slides/<deck>/index.md から、各スライドの PNG（slidev export）と
 * スピーカーノート（<!-- -->＝ナレーション）の VOICEVOX 音声を合成し、1 本の mp4 にまとめる。
 *
 * 使い方:
 *   node scripts/build-sim-video.mjs <deck> [speaker=30] [speedScale=0.9]
 *
 * 前提:
 *   - VOICEVOX エンジンが http://localhost:50021 で起動していること
 *   - playwright-chromium（slidev export 用）/ ffmpeg がインストール済みであること
 *
 * ナレーションのソース:
 *   index.md の各スライドのスピーカーノート（<!-- ... -->）。スライド順に 1 対 1 で読み上げる。
 *   ※ 全スライドにノートがある前提（ノート数 = スライド PNG 数）。
 *
 * 差分ビルド:
 *   _sim/.manifest.json にハッシュを記録し、前回と変わった部分だけ作り直す。
 *   全再生成したいときは _sim/ ディレクトリを削除してから実行する。
 *
 * 出力: src/content/slides/<deck>/_sim/rehearsal.mp4
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BASE = 'http://localhost:50021';

const deck = process.argv[2];
const speaker = process.argv[3] ? Number(process.argv[3]) : 30;
const speedScale = process.argv[4] ? Number(process.argv[4]) : 0.9;

if (!deck) {
  console.error('usage: node scripts/build-sim-video.mjs <deck> [speaker=30] [speedScale=0.9]');
  process.exit(1);
}

const deckDir = join(ROOT, 'src/content/slides', deck);
const indexPath = join(deckDir, 'index.md');
const simDir = join(deckDir, '_sim');
const audioDir = join(simDir, 'audio');
const pngDir = join(simDir, 'png');
const segDir = join(simDir, 'seg');
const manifestPath = join(simDir, '.manifest.json');

const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);
const fileSha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex').slice(0, 16);
const pad = (n) => String(n).padStart(2, '0');

/** index.md のスピーカーノート（<!-- ... -->）をスライド順に抽出（ナレーション） */
function parseNotes(text) {
  const notes = [];
  const re = /<!--([\s\S]*?)-->/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const body = m[1].trim();
    if (body) notes.push({ body });
  }
  return notes;
}

function wavDuration(buf) {
  const byteRate = buf.readUInt32LE(28);
  let off = 12;
  while (off < buf.length - 8) {
    const id = buf.toString('ascii', off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === 'data') return size / byteRate;
    off += 8 + size;
  }
  return null;
}

/** VOICEVOX で 1 ブロックを合成して wav バッファを返す（speedScale 適用） */
async function synth(text, spk, speed) {
  const qr = await fetch(`${BASE}/audio_query?speaker=${spk}&text=${encodeURIComponent(text)}`, {
    method: 'POST',
  });
  if (!qr.ok) throw new Error('audio_query ' + qr.status);
  const query = await qr.json();
  query.speedScale = speed;
  const sr = await fetch(`${BASE}/synthesis?speaker=${spk}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query),
  });
  if (!sr.ok) throw new Error('synthesis ' + sr.status);
  return Buffer.from(await sr.arrayBuffer());
}

function ff(args) {
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], {
    stdio: 'inherit',
  });
}

async function main() {
  const indexText = readFileSync(indexPath, 'utf8');
  const blocks = parseNotes(indexText);
  for (const d of [audioDir, pngDir, segDir]) mkdirSync(d, { recursive: true });

  let prev = null;
  if (existsSync(manifestPath)) {
    try {
      prev = JSON.parse(readFileSync(manifestPath, 'utf8'));
    } catch {
      prev = null;
    }
  }
  const manifest = { speaker, speed: speedScale, indexHash: '', blocks: [] };
  console.log(
    `🎬 deck=${deck} / notes=${blocks.length} / speaker=${speaker} / speedScale=${speedScale}`,
  );

  // 1) 音声: ノートのテキスト + speaker + speed のキーで差分
  console.log('🔊 Narration (VOICEVOX, from speaker notes)...');
  let audioRegen = 0;
  const durations = [];
  for (let i = 0; i < blocks.length; i++) {
    const wavPath = join(audioDir, `${pad(i + 1)}.wav`);
    const audioKey = sha(`${blocks[i].body}|${speaker}|${speedScale}`);
    const prevB = prev?.blocks?.[i];
    let buf;
    if (prevB && prevB.audioKey === audioKey && existsSync(wavPath)) {
      buf = readFileSync(wavPath);
    } else {
      buf = await synth(blocks[i].body, speaker, speedScale);
      writeFileSync(wavPath, buf);
      audioRegen++;
    }
    durations.push(wavDuration(buf));
    manifest.blocks.push({ audioKey });
  }
  console.log(`   ${audioRegen} regenerated, ${blocks.length - audioRegen} reused`);

  // 2) PNG: index.md のハッシュで slidev export の要否を判定
  const indexHash = fileSha(indexPath);
  manifest.indexHash = indexHash;
  const existingPngs = existsSync(pngDir)
    ? readdirSync(pngDir).filter((f) => f.toLowerCase().endsWith('.png'))
    : [];
  const needExport = !prev || prev.indexHash !== indexHash || existingPngs.length !== blocks.length;
  if (needExport) {
    console.log('🖼️  Exporting slides (slidev)...');
    execFileSync(
      'pnpm',
      [
        'slidev',
        'export',
        indexPath,
        '--format',
        'png',
        '--per-slide',
        '--output',
        pngDir,
        '--timeout',
        '60000',
      ],
      { cwd: ROOT, stdio: 'inherit', shell: true },
    );
  } else {
    console.log('🖼️  index.md unchanged → skip slidev export');
  }
  const pngs = readdirSync(pngDir)
    .filter((f) => f.toLowerCase().endsWith('.png'))
    .sort();
  if (pngs.length !== blocks.length) {
    console.warn(
      `⚠️  PNG 枚数(${pngs.length}) とノート数(${blocks.length})が不一致。全スライドにノートがあるか確認してください。`,
    );
  }

  // 3) セグメント: 該当スライドの PNG と音声のどちらかが変わった時だけ作り直す
  console.log('🎞️  Segments...');
  let segRegen = 0;
  const n = Math.min(pngs.length, blocks.length);
  const segFiles = [];
  for (let i = 0; i < n; i++) {
    const png = join(pngDir, pngs[i]);
    const wav = join(audioDir, `${pad(i + 1)}.wav`);
    const seg = join(segDir, `${pad(i + 1)}.mp4`);
    const pngHash = fileSha(png);
    const segKey = `${manifest.blocks[i].audioKey}|${pngHash}`;
    manifest.blocks[i].pngHash = pngHash;
    manifest.blocks[i].segKey = segKey;
    const prevB = prev?.blocks?.[i];
    if (prevB && prevB.segKey === segKey && existsSync(seg)) {
      // reuse
    } else {
      ff([
        '-loop',
        '1',
        '-i',
        png,
        '-i',
        wav,
        '-c:v',
        'libx264',
        '-tune',
        'stillimage',
        '-pix_fmt',
        'yuv420p',
        '-r',
        '30',
        '-c:a',
        'aac',
        '-b:a',
        '192k',
        '-ar',
        '44100',
        '-shortest',
        seg,
      ]);
      segRegen++;
    }
    segFiles.push(seg);
  }
  console.log(`   ${segRegen} regenerated, ${n - segRegen} reused`);

  // 4) 連結: セグメントに変化があった or 出力が無い or 構成が変わった時だけ
  const out = join(simDir, 'rehearsal.mp4');
  const needConcat = segRegen > 0 || !existsSync(out) || prev?.blocks?.length !== blocks.length;
  if (needConcat) {
    console.log('🔗 Concatenating...');
    const listPath = join(segDir, 'list.txt');
    writeFileSync(listPath, segFiles.map((f) => `file '${f.replace(/\\/g, '/')}'`).join('\n'));
    ff(['-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', out]);
  } else {
    console.log('🔗 No segment changes → skip concat');
  }

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  const total = durations.reduce((a, b) => a + b, 0);
  console.log(`\n✅ ${out}`);
  console.log(
    `   ${total.toFixed(0)}s (${(total / 60).toFixed(1)}分) / speaker=${speaker} / speed=${speedScale} / audio:${audioRegen}再生成 seg:${segRegen}再生成`,
  );
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
