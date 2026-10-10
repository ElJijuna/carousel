import { expect, type Page, test } from '@playwright/test';
import { openStory, track } from './helpers';

const selectedDot = (page: Page) =>
  page.locator('[data-testid^="autoplay-dot-"][aria-current="page"]');
async function fraction(page: Page, index: number) {
  return page.getByTestId(`autoplay-dot-${index}-progress`).evaluate((element) => {
    const parent = element.parentElement;
    if (!parent) {
      throw new Error('Progress fill has no track');
    }
    return (
      Number.parseFloat(getComputedStyle(element).width) /
      Number.parseFloat(getComputedStyle(parent).width)
    );
  });
}

for (const story of ['auto-play-progress', 'custom-auto-play-progress']) {
  for (const mode of ['classic', 'card']) {
    test(`${story} fills, freezes and resumes in ${mode}`, async ({ page }) => {
      await openStory(page, story, `interval:1500;mode:${mode}`);
      await expect.poll(() => fraction(page, 0)).toBeGreaterThan(0.2);
      await page.getByTestId('play-pause').click();
      await expect(page.getByTestId('play-pause')).toHaveAccessibleName(
        'Resume automatic rotation',
      );
      const paused = await fraction(page, 0);
      expect(paused).toBeGreaterThan(0.2);
      expect(paused).toBeLessThan(0.9);
      // Sample across real frames: freezing must hold for longer than a cycle.
      await expect
        .poll(
          async () => {
            await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 1700)));
            return fraction(page, 0);
          },
          { timeout: 4000 },
        )
        .toBeCloseTo(paused, 2);
      await expect(selectedDot(page)).toHaveAttribute('data-testid', 'autoplay-dot-0');
      await page.getByTestId('play-pause').click();
      await expect.poll(() => fraction(page, 0)).toBeGreaterThan(paused + 0.08);
      await expect(selectedDot(page)).toHaveAttribute('data-testid', 'autoplay-dot-1');
      await expect.poll(() => fraction(page, 1)).toBeGreaterThan(0.15);
      await page.getByTestId('play-pause').click();
      expect(await fraction(page, 1)).toBeLessThan(0.7);
      if (story === 'custom-auto-play-progress') {
        await expect(page.getByTestId('autoplay-clock')).toContainText('1500ms · paused');
      }
    });
  }
}

test('card progress waits for the flip and restarts when navigating manually', async ({ page }) => {
  await openStory(page, 'auto-play-progress', 'interval:5000;mode:card');
  await expect.poll(() => fraction(page, 0)).toBeGreaterThan(0.08);
  await page.getByTestId('autoplay-dot-2').click();
  // The incoming page's bar stays empty while both faces are mounted.
  await expect(track(page).locator('[data-testid*="-face-"]')).toHaveCount(2);
  expect(await fraction(page, 2)).toBe(0);
  await expect(track(page).locator('[data-testid*="-face-"]')).toHaveCount(1);
  await expect.poll(() => fraction(page, 2)).toBeGreaterThan(0.04);
  expect(await fraction(page, 2)).toBeLessThan(0.3);
});

test('reduced motion freezes progress and suspends page advances', async ({ page }) => {
  await openStory(page, 'custom-auto-play-progress', 'interval:1500');
  await expect.poll(() => fraction(page, 0)).toBeGreaterThan(0.2);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.getByTestId('autoplay-clock')).toContainText('paused');
  const paused = await fraction(page, 0);
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 1700)));
  expect(await fraction(page, 0)).toBeCloseTo(paused, 2);
  await expect(selectedDot(page)).toHaveAttribute('data-testid', 'autoplay-dot-0');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(selectedDot(page)).toHaveAttribute('data-testid', 'autoplay-dot-1');
});
