import { test, expect } from '@playwright/test';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const SHOTS = path.join('test-results', 'screenshots');

test.beforeAll(async () => {
  await fs.mkdir(SHOTS, { recursive: true });
});

test.describe('responsive layout', () => {
  test('never scrolls horizontally', async ({ page }) => {
    await page.goto('./');
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  });

  test('keeps the search and directory usable', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('#hero-search')).toBeVisible();
    await expect(page.locator('#directory-search')).toBeVisible();

    await page.locator('#hero-search').scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(SHOTS, `hero-${test.info().project.name}.png`),
      animations: 'disabled',
    });

    await page.goto('./#directory');
    const grid = page.locator('.site-card').first();
    if (await grid.count()) {
      await expect(grid).toBeVisible();
      const viewport = page.viewportSize()!;
      const box = await grid.boundingBox();
      expect(box!.width).toBeLessThanOrEqual(viewport.width);
      await page.screenshot({
        path: path.join(SHOTS, `directory-${test.info().project.name}.png`),
        fullPage: false,
        animations: 'disabled',
      });
    }
  });

  test('stacks cards into a single column on small screens', async ({ page }) => {
    const viewport = page.viewportSize()!;
    test.skip(viewport.width > 640, 'Only relevant for phone-sized viewports');
    await page.goto('./#directory');
    const cards = page.locator('.site-card');
    if ((await cards.count()) < 2) test.skip(true, 'Not enough published cards to compare');
    const first = await cards.nth(0).boundingBox();
    const second = await cards.nth(1).boundingBox();
    expect(first!.x).toBeCloseTo(second!.x, 0);
    expect(second!.y).toBeGreaterThan(first!.y + first!.height - 1);
  });

  test('uses a three-column grid on wide screens', async ({ page }) => {
    const viewport = page.viewportSize()!;
    test.skip(viewport.width < 1280, 'Only relevant for wide viewports');
    await page.goto('./#directory');
    const cards = page.locator('.site-card');
    if ((await cards.count()) < 3) test.skip(true, 'Not enough published cards to compare');
    const boxes = await Promise.all([0, 1, 2].map(async (index) => cards.nth(index).boundingBox()));
    const ys = boxes.map((box) => Math.round(box!.y));
    expect(new Set(ys).size).toBe(1);
  });

  test('keeps the header controls reachable on mobile', async ({ page }) => {
    await page.goto('./');
    await expect(page.getByRole('button', { name: /search the directory/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /switch to (light|dark) theme/i })).toBeVisible();
    await page.getByRole('button', { name: /search the directory/i }).click();
    await expect(page.locator('dialog.palette')).toBeVisible();
  });
});
