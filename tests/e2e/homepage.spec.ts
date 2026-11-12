import { test, expect } from '@playwright/test';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const SHOTS = path.join('test-results', 'screenshots');

test.beforeAll(async () => {
  await fs.mkdir(SHOTS, { recursive: true });
});

test.describe('home page', () => {
  test('renders the brand, hero and live status without console errors', async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await page.goto('./');
    await expect(page).toHaveTitle(/Powerful Websites/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/discover websites you/i);
    await expect(page.getByText(/no accounts\. no unnecessary barriers/i)).toBeVisible();
    await expect(page.getByText(/current date & time/i)).toBeVisible();
    await expect(page.getByText(/last searched/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'SCOUT' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'VERIFIER' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'CURATOR' })).toBeVisible();

    await page.screenshot({
      path: path.join(SHOTS, `home-${testInfo.project.name}.png`),
      fullPage: true,
      animations: 'disabled',
    });

    expect(errors, `Console errors: ${errors.join(' | ')}`).toEqual([]);
  });

  test('updates the visitor clock in real time', async ({ page }) => {
    await page.goto('./');
    const clock = page.locator('#live-status').getByText(/^\d{2}:\d{2}:\d{2}$/).first();
    await expect(clock).toBeVisible();
    const first = await clock.textContent();
    await page.waitForTimeout(1200);
    const second = await clock.textContent();
    expect(first).not.toBe(second);
  });

  test('states the scan schedule and exposes workflow history', async ({ page }) => {
    await page.goto('./');
    await expect(page.getByText(/every 15 min/i).first()).toBeVisible();
    const history = page.getByRole('link', { name: /workflow history/i }).first();
    await expect(history).toHaveAttribute('href', /github\.com\/LIN4CRE\/Powerful-websites\/actions/);
    await expect(history).toHaveAttribute('target', '_blank');
    await expect(history).toHaveAttribute('rel', /noopener/);
  });

  test('switches theme and remembers the choice', async ({ page }) => {
    await page.goto('./');
    const toggle = page.getByRole('button', { name: /switch to light theme/i });
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.getByRole('button', { name: /switch to dark theme/i }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('never creates cookies', async ({ page, context }) => {
    await page.goto('./');
    await page.waitForTimeout(500);
    const cookies = await context.cookies();
    expect(cookies).toEqual([]);
  });

  test('footer explains privacy and licensing', async ({ page }) => {
    await page.goto('./');
    await expect(page.getByText(/no accounts · no trackers · no cookies/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /MIT licence/i })).toHaveAttribute('href', /LICENSE/);
  });
});
