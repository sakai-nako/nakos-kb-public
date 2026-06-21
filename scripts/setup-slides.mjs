#!/usr/bin/env node
/**
 * src/content/slides/ 配下の各デッキに _shared/ への junction とコピーを冪等に展開する。
 */

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { setupAllDecks } from './lib/setup-slide-decks.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

const slidesDir = join(PROJECT_ROOT, 'src/content/slides');
const sharedDir = join(slidesDir, '_shared');

setupAllDecks(slidesDir, sharedDir);
console.log('Done.');
