import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.KB_E2E_PORT ?? 5300);
const astro = fileURLToPath(new URL('./node_modules/astro/bin/astro.mjs', import.meta.url));
export default defineConfig({
  testDir: './tests',
  testMatch: 'site.spec.ts',
  reporter: 'list',
  use: { baseURL: `http://127.0.0.1:${port}` },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `deno run -A "${astro}" dev --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    env: {
      // Astro 7 の自動バックグラウンド化を抑え、Playwright がこの子プロセスを管理する。
      ASTRO_DEV_BACKGROUND: '1',
      KB_CONTENT_ROOT: fileURLToPath(new URL('./tests/fixtures/novels', import.meta.url)),
      KB_ABOUT_CONTENT_ROOT: fileURLToPath(new URL('./tests/fixtures/about', import.meta.url)),
      KB_EVENTS_CONTENT_ROOT: fileURLToPath(new URL('./tests/fixtures/events', import.meta.url)),
      KB_CFP_CONTENT_ROOT: fileURLToPath(new URL('./tests/fixtures/cfp', import.meta.url)),
      KB_BLOG_CONTENT_ROOT: fileURLToPath(new URL('./tests/fixtures/blog', import.meta.url)),
      KB_SLIDES_CONTENT_ROOT: fileURLToPath(new URL('./tests/fixtures/slides', import.meta.url)),
    },
  },
});
