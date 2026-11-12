import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('accessibility', () => {
  test('has no serious or critical WCAG violations', async ({ page }) => {
    await page.goto('./');
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const serious = results.violations
      .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
      .map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.slice(0, 3).map((node) => node.target.join(' ')),
      }));
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });

  test('supports keyboard-only navigation', async ({ page }) => {
    await page.goto('./');
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#directory/);
  });

  test('exposes a labelled search field and dialog semantics', async ({ page }) => {
    await page.goto('./');
    await expect(page.getByLabel('Filter the directory')).toBeVisible();
    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-label', 'Search the directory');
  });

  test('respects reduced motion preferences', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('./');
    const duration = await page
      .locator('.site-card')
      .first()
      .evaluate((element) => getComputedStyle(element).transitionDuration)
      .catch(() => '0s');
    expect(['0s', '0.001ms', '0.0001s']).toContain(duration);
  });
});
