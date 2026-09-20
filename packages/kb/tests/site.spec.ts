import { expect, test } from '@playwright/test';

test('browses fixture projection safely with keyboard, canonical paths, and themes', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page).toHaveURL(/\/about$/);
  await expect(page).toHaveTitle("About | Nako's Knowledge Base");
  await expect(page.getByRole('link', { name: "Nako's Knowledge Base ホーム" })).toBeVisible();
  await expect(page.getByRole('link', { name: 'About' })).toHaveAttribute('aria-current', 'page');
  const headerInner = page.locator('.nk-site-header__inner');
  await expect(headerInner).toBeVisible();
  await expect(headerInner).toHaveCSS('display', 'grid');
  await expect(page.locator('main.nk-page')).toHaveCount(1);
  await expect(page.locator('.nk-card-grid[role="list"] .nk-card')).toHaveCount(2);
  const about = page.getByRole('link', { name: 'とても長い公開セルフポートレート' });
  await about.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveTitle("とても長い公開セルフポートレート | Nako's Knowledge Base");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    '/about/self-portrait',
  );
  await expect(page.getByRole('link', { name: '外部リンク' })).toHaveCount(0);
  await expect(page.getByText('javascript:alert(1) はリンクとして実行されません。')).toBeVisible();
  await expect(page.locator('main script')).toHaveCount(0);
  await page.goto('/about/profile');
  await expect(page.getByRole('link', { name: '外部リンク' })).toHaveAttribute(
    'rel',
    'noopener noreferrer',
  );
  await expect(page.getByText('<script>window.aboutXss = true</script>')).toBeVisible();
  await expect(page.getByRole('link', { name: '下書き' })).toHaveCount(0);
  await page.goto('/novels');
  await expect(page).toHaveTitle("小説 | Nako's Knowledge Base");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', '/novels');
  await page.getByRole('button', { name: 'Dark' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'System' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme-preference', 'system');
  const novel = page.getByRole('link', { name: /とても長い公開小説/ });
  await novel.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /\/novels\/fixture-work$/,
  );
  const first = page.getByRole('link', { name: /とても長い第一章/ });
  await first.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /\/novels\/fixture-work\/first$/,
  );
  await expect(page.locator('ruby')).toHaveText('漢字かんじ');
  await expect(page.locator('rt')).toHaveText('かんじ');
  await expect(page.locator('.dots')).toHaveText('傍点');
  await expect(page.locator('.scene-break')).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'https://example.com/path' })).toHaveAttribute(
    'rel',
    'noopener noreferrer',
  );
  await expect(page.getByText('<script>window.xss=true</script>')).toBeVisible();
  await expect(page.locator('main script')).toHaveCount(0);
  await page.getByRole('link', { name: '次の章' }).click();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    '/novels/fixture-work/last',
  );
  await expect(page.getByRole('link', { name: '前の章' })).toBeVisible();
  await page.goto('/novels/fixture-work');
  await expect(page.getByRole('link', { name: '第九十九章' })).toBeVisible();
  await expect(page.getByRole('link', { name: '第百章' })).toBeVisible();
  await expect(page.getByRole('link', { name: '第百一章' })).toBeVisible();
  await expect(page.getByRole('link', { name: '第千章' })).toBeVisible();
  await expect(page.getByRole('link', { name: '一桁ファイル' })).toHaveCount(0);
  await page.getByRole('link', { name: '第百章' }).click();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    '/novels/fixture-work/one-hundred',
  );
  await expect(page.getByRole('link', { name: '前の章' })).toHaveAttribute(
    'href',
    '/novels/fixture-work/ninety-nine',
  );
  await expect(page.getByRole('link', { name: '次の章' })).toHaveAttribute(
    'href',
    '/novels/fixture-work/one-oh-one',
  );
  await page.getByRole('link', { name: '次の章' }).click();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    '/novels/fixture-work/one-oh-one',
  );
  await expect(page.getByRole('link', { name: '次の章' })).toHaveAttribute(
    'href',
    '/novels/fixture-work/thousand',
  );
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
  ).toBeFalsy();
  expect(errors).toEqual([]);
  await page.goto('/about/missing');
  await expect(page.getByText('404')).toBeVisible();
  await page.goto('/novels/missing');
  await expect(page.getByText('404')).toBeVisible();
});

test('keeps primary reading links available without JavaScript and at wide width', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  await page.goto('/novels');
  await expect(page.getByRole('link', { name: /とても長い公開小説/ })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
  ).toBeFalsy();
  await page.goto('/about');
  await expect(page.getByRole('link', { name: '公開プロフィール' })).toBeVisible();
  await context.close();
});

test('lists events newest first and renders a detail page safely in JST', async ({ page }) => {
  await page.goto('/events');
  await expect(page).toHaveTitle("Events | Nako's Knowledge Base");
  await expect(page.getByRole('link', { name: 'Events' })).toHaveAttribute('aria-current', 'page');
  const cards = page.locator('.nk-card-grid .nk-card');
  await expect(cards).toHaveCount(2);
  await expect(cards.first()).toContainText('合成イベント B');
  await expect(cards.nth(1)).toContainText('合成資料 A');
  await page.getByRole('link', { name: /合成イベント A/ }).click();
  await expect(page).toHaveURL(/\/events\/2026-01-01-fixture-a$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    '/events/2026-01-01-fixture-a',
  );
  await expect(page.getByText('<script>alert(1)</script>')).toBeVisible();
  await expect(page.locator('main script')).toHaveCount(0);
  await expect(page.getByText(/1月1日.*10:00/)).toBeVisible(); // 01:00Z = JST 10:00
  await expect(page.getByRole('link', { name: 'イベントページを開く' })).toHaveAttribute(
    'rel',
    'noopener noreferrer',
  );
  await expect(page.getByRole('link', { name: '合成資料 A' })).toHaveAttribute(
    'href',
    'https://example.com/deck-a',
  );
  // CfP の節も chip を持つので、関わり方の節に絞って確認する。
  await expect(
    page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: '関わり方' }) })
      .locator('.nk-chip'),
  ).toHaveText(['speaker', 'organizer']);
  await page.goto('/events/2026-02-02-fixture-b');
  await expect(page.getByRole('link', { name: 'イベントページを開く' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '発表資料' })).toHaveCount(0);
});

test('renders a cfp with sanitized markdown, its drafts page, and the event backlink', async ({
  page,
}) => {
  await page.goto('/cfp/2026-01-01-fixture-cfp');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    '/cfp/2026-01-01-fixture-cfp',
  );
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('合成 CFP <b>x</b>');
  await expect(page.locator('h2#トークタイトル')).toBeVisible();
  await expect(page.locator('.nk-prose').getByText('<script>alert(1)</script>')).toBeVisible();
  await expect(page.locator('main script')).toHaveCount(0);
  await expect(page.getByRole('link', { name: '外部' })).toHaveAttribute(
    'rel',
    'noopener noreferrer',
  );
  await expect(page.getByRole('link', { name: '危険' })).toHaveCount(0);
  await expect(page.locator('.nk-chip', { hasText: '採択' })).toBeVisible();
  await page.getByRole('link', { name: '合成イベント A <script>alert(1)</script>' }).click();
  await expect(page).toHaveURL(/\/events\/2026-01-01-fixture-a$/);
  await expect(page.getByRole('heading', { name: 'CfP' })).toBeVisible();
  await page.getByRole('link', { name: 'サイトで読む' }).click();
  await expect(page).toHaveURL(/\/cfp\/2026-01-01-fixture-cfp$/);
  await page.getByRole('link', { name: '校正過程を見る' }).click();
  await expect(page).toHaveURL(/\/cfp\/2026-01-01-fixture-cfp\/drafts$/);
  await expect(page.locator('h3#round-1-改善ログ型適合')).toBeVisible();
  await expect(page.getByRole('link', { name: 'CfP 本文に戻る' })).toBeVisible();
});

test('lists blog posts newest first and renders one safely', async ({ page }) => {
  await page.goto('/blog');
  await expect(page).toHaveTitle("Blog | Nako's Knowledge Base");
  await expect(page.getByRole('link', { name: 'Blog', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  const cards = page.locator('.nk-card-grid[role="list"] .nk-card');
  await expect(cards).toHaveCount(2);
  await expect(cards.first()).toContainText('あとから出した合成の記事');
  await expect(cards.first()).toContainText('2026/02/02');
  await expect(cards.nth(1)).toContainText('合成の記事 <b>x</b>');
  await page.getByRole('link', { name: '合成の記事 <b>x</b>' }).click();
  await expect(page).toHaveURL(/\/blog\/2026-01-01-fixture-post$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    '/blog/2026-01-01-fixture-post',
  );
  await expect(page.getByRole('link', { name: 'Blog', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('合成の記事 <b>x</b>');
  await expect(page.locator('.nk-chip')).toHaveText(['fixture', 'ai']);
  await expect(page.locator('h2#はじめに')).toBeVisible();
  await expect(page.locator('.nk-prose').getByText('<script>alert(1)</script>')).toBeVisible();
  await expect(page.locator('main script')).toHaveCount(0);
  await expect(page.getByRole('link', { name: '外部' })).toHaveAttribute(
    'rel',
    'noopener noreferrer',
  );
  await expect(page.getByRole('link', { name: '危険' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Blog 一覧' }).click();
  await expect(page).toHaveURL(/\/blog$/);
});

// デッキ本体は Slidev が別に build するので、一覧は別タブへのリンクだけを持つ。
test('lists slide decks and links out to each built deck', async ({ page }) => {
  await page.goto('/slides');
  await expect(page).toHaveTitle("Slides | Nako's Knowledge Base");
  await expect(page.getByRole('link', { name: 'Slides', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  const cards = page.locator('.nk-card-grid[role="list"] .nk-card');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('2026/01/01');
  await expect(cards.first()).toContainText('合成イベント A');
  const deck = page.getByRole('link', { name: '合成デッキ <b>x</b>' });
  await expect(deck).toHaveAttribute('href', '/slides/2026-01-01-fixture-deck/');
  await expect(deck).toHaveAttribute('target', '_blank');
  await expect(deck).toHaveAttribute('rel', 'noopener noreferrer');
  await page.goto('/events/2026-01-01-fixture-a');
  const section = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'スライド' }) });
  await expect(section.getByRole('link', { name: '合成デッキ <b>x</b>' })).toHaveAttribute(
    'href',
    '/slides/2026-01-01-fixture-deck/',
  );
  await page.goto('/events/2026-02-02-fixture-b');
  await expect(page.getByRole('heading', { name: 'スライド' })).toHaveCount(0);
});

// dev server は redirect 先の /404 を 200 で返し、静的配信 (static-web-server) は 404 を返す。
test('serves a real 404 page with the site header', async ({ page }) => {
  const response = await page.goto('/novels/not-a-work');
  expect([200, 404]).toContain(response?.status() ?? 0);
  await expect(
    page.getByRole('heading', { level: 1, name: 'ページが見つかりません' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: "Nako's Knowledge Base ホーム" })).toBeVisible();
});

// 見出しは自分の節へのリンクを兼ねる。飛んだ先が sticky ヘッダーの下に潜ると、
// 読み手はその見出しを見失う。広い画面と狭い画面の両方で、見出しがヘッダーより
// 下に出ることを確かめる。
for (const [label, width, height] of [
  ['wide', 1280, 720],
  ['narrow', 375, 720],
] as const) {
  test(`keeps a heading below the sticky header after following its own link (${label})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/about/profile');
    const link = page.getByRole('link', { name: '関心', exact: true });
    await link.click();
    await expect(page).toHaveURL(new RegExp(`#${encodeURIComponent('関心')}$`));
    const header = page.locator('.nk-site-header');
    const heading = page.locator('h2#関心');
    const headerBox = await header.boundingBox();
    const headingBox = await heading.boundingBox();
    expect(headerBox).not.toBeNull();
    expect(headingBox).not.toBeNull();
    const below = headingBox!.y - (headerBox!.y + headerBox!.height);
    expect(below).toBeGreaterThanOrEqual(0);
    // 空けすぎると飛んだ先が画面の中ほどに出る。ヘッダー直下から 1 行ぶんまでに収める。
    expect(below).toBeLessThan(48);
  });
}
