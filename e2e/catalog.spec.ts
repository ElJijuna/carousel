import { expect, test } from '@playwright/test';
import { type CatalogStory, catalog, storyId } from '../src/stories/catalog';
import { openStory } from './helpers';

test('catalog exposes exactly the 29 examples in six sections', async ({ request }) => {
  const response = await request.get('/index.json');
  const index = await response.json();
  const stories = Object.values(index.entries) as { id: string; type: string; title: string }[];
  const examples = stories.filter((entry) => entry.type === 'story');
  expect(examples.map((entry) => entry.id).sort()).toEqual(
    (Object.keys(catalog) as CatalogStory[]).map(storyId).sort(),
  );
  expect(new Set(examples.map((entry) => entry.title)).size).toBe(6);
});

for (const width of [390, 1280]) {
  test(`catalog previews remain usable at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const story of [
      'responsive',
      'card',
      'auto-play-progress',
      'custom-auto-play-progress',
      'gallery',
      'day-calendar',
      'page-layout',
      'overlay-pagination',
    ] as const) {
      await openStory(
        page,
        story,
        story.includes('auto-play-progress') ? 'interval:8000' : 'autoPlay:false',
      );
      await expect(
        page.getByRole('heading', { name: catalog[story].title, exact: true }),
      ).toBeVisible();
      await expect(page.getByText(catalog[story].instruction, { exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      await page.screenshot({ path: testInfo.outputPath(`${story}-${width}.png`), fullPage: true });
    }
    await page.goto(`/iframe.html?id=${storyId('fill-height')}&viewMode=story`);
    await expect(page.getByTestId('fill-children-track')).toBeVisible();
    await expect(page.getByTestId('fill-data-track')).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath(`fill-height-${width}.png`),
      fullPage: true,
    });
  });
}
