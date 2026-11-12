import { test, expect } from '@playwright/test';
import { promises as fs } from 'node:fs';
import type { Category, Site } from '../../src/lib/types';

const sitesFile = JSON.parse(await fs.readFile('data/sites.json', 'utf8')) as { sites: Site[] };
const categoriesFile = JSON.parse(await fs.readFile('data/categories.json', 'utf8')) as {
  categories: Category[];
};
const sites = sitesFile.sites;
const firstSite = sites[0];
const firstCategory = firstSite
  ? categoriesFile.categories.find((category) => category.id === firstSite.category)
  : undefined;

test.describe('directory', () => {
  test.beforeEach(() => {
    test.skip(sites.length === 0, 'No verified sites have been published in this build yet');
  });

  test('lists verified websites that open the official destination', async ({ page }) => {
    await page.goto('./#directory');
    const cards = page.locator('.site-card');
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(0);

    const card = page.locator('.site-card').filter({ hasText: firstSite!.name }).first();
    const link = card.getByRole('link', { name: /opens the official website/i });
    await expect(link).toHaveAttribute('href', firstSite!.url);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
    await expect(link).toHaveAttribute('rel', /noreferrer/);
    await expect(card.getByText('No login required')).toBeVisible();
    await expect(card.getByText('Free')).toBeVisible();
  });

  test('filters instantly by search term', async ({ page }) => {
    await page.goto('./#directory');
    await expect(page.getByText(/of \d+ matching/).first()).toBeVisible();

    const input = page.getByLabel('Filter the directory');
    await input.fill(firstSite!.name);
    await expect(
      page.locator('.site-card').filter({ hasText: firstSite!.name }).first(),
    ).toBeVisible();
    const matching = await page.locator('.site-card').count();
    expect(matching).toBeLessThanOrEqual(sites.length);

    await input.fill('zzzz-not-a-real-tool');
    await expect(page.getByText(/nothing matches those filters yet/i)).toBeVisible();

    await input.fill('');
    await expect(page.locator('.site-card').first()).toBeVisible();
  });

  test('filters by category and resets cleanly', async ({ page }) => {
    await page.goto('./#directory');
    const label = firstCategory!.name;
    await page.getByRole('button', { name: new RegExp(label.split(' & ')[0]!, 'i') }).first().click();
    await expect(page.locator('.site-card').first()).toBeVisible();
    const badges = await page.locator('.site-card .badge--accent').allTextContents();
    expect(badges.length).toBeGreaterThan(0);

    await page.getByRole('button', { name: /all websites/i }).click();
    await expect(page.locator('.site-card').first()).toBeVisible();
    await expect(page.getByText(/of \d+ matching/).first()).toContainText(String(sites.length));
  });

  test('sorts alphabetically', async ({ page }) => {
    await page.goto('./#directory');
    await page.getByLabel('Sort websites').selectOption('name');
    const names = (await page.locator('.site-card h3').allTextContents()).map((name) => name.trim());
    const sorted = [...names].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    expect(names.slice(0, 10)).toEqual(sorted.slice(0, 10));
  });

  test('open-source filter only shows confirmed projects', async ({ page }) => {
    const openSource = sites.filter((site) => site.openSource);
    test.skip(openSource.length === 0, 'No open-source sites published yet');
    await page.goto('./#directory');
    await page.getByRole('button', { name: /^Open source$/i }).click();
    const cards = page.locator('.site-card');
    await expect(cards.first()).toBeVisible();
    const badges = await cards.locator('.badge', { hasText: 'Open source' }).count();
    expect(badges).toBe(await cards.count());
  });

  test('saves favourites in local storage only', async ({ page }) => {
    await page.goto('./#directory');
    const card = page.locator('.site-card').first();
    const name = (await card.locator('h3').textContent())?.trim() ?? '';
    await card.getByRole('button', { name: /save .* for later/i }).click();
    const stored = await page.evaluate(() => window.localStorage.getItem('pw:saved'));
    expect(stored).toContain('[');

    await page.getByRole('button', { name: /^Saved/ }).click();
    await expect(page.locator('.site-card')).toHaveCount(1);
    await expect(page.locator('.site-card')).toContainText(name);
  });

  test('opens the command palette with the keyboard', async ({ page }) => {
    await page.goto('./');
    await page.keyboard.press('Control+k');
    const dialog = page.locator('dialog.palette');
    await expect(dialog).toBeVisible();
    await page.getByLabel('Search query').fill(firstSite!.name);
    await expect(
      dialog.getByRole('link', { name: new RegExp(firstSite!.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }).first(),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });
});
