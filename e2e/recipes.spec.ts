import { expect, test } from '@playwright/test';

import { expectSelectedPage, openStory, pageWidth, restingOffset, scrollLeft } from './helpers';

/**
 * The recipe stories: the ones that show the component doing a real job rather
 * than demonstrating a single prop.
 *
 * They are worth driving for the same reason the rest of this suite exists —
 * every claim they make is about real layout in a real scroll container, and a
 * unit test renders neither.
 *
 * @module
 */

test.describe('split cards', () => {
  /** The card's two halves, measured where the browser actually put them. */
  const halves = (page: Parameters<typeof pageWidth>[0]) =>
    page.evaluate(() => {
      const card = document.querySelector(
        '[data-testid^="feature-"]:not([data-testid$="-image"])',
      ) as HTMLElement;
      const image = card.querySelector('[data-testid$="-image"]') as HTMLElement;
      const body = card.firstElementChild as HTMLElement;
      return {
        body: body.getBoundingClientRect().width,
        image: image.getBoundingClientRect().width,
        // With the card's `overflow: hidden`, text that runs past the footer
        // is invisible but still measurable here.
        overflow: card.scrollHeight - card.clientHeight,
      };
    });

  test('splits the slide down the middle', async ({ page }) => {
    await openStory(page, 'split-cards');

    const { body, image, overflow } = await halves(page);

    expect(Math.abs(body - image)).toBeLessThanOrEqual(1);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('stays split, and inside the card, on a narrower slide', async ({ page }) => {
    await openStory(page, 'split-cards', 'visibleSlides:2;peek:0;spacing:12');

    const { body, image, overflow } = await halves(page);

    // A third of the width it had, and still two equal halves.
    expect(image).toBeLessThan(200);
    expect(Math.abs(body - image)).toBeLessThanOrEqual(1);
    // The copy is clamped rather than running through the footer.
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('credit cards', () => {
  test('loops in the data mode, not just the children one', async ({ page }) => {
    await openStory(page, 'credit-cards');

    // Four pages of one card each — but only a window of them is mounted, so
    // the dots are what count the deck, not the DOM.
    await expect(page.getByTestId(/^dot-\d+$/)).toHaveCount(4);
    await expect(page.getByTestId(/^card-/).first()).toBeVisible();
    expect(await scrollLeft(page)).toBe(0);

    // `loop` over a FlatList: the wrap has to survive virtualization, which is
    // the one combination the `loop` and `virtualized` stories each miss.
    await page.getByTestId('arrow-previous').click();
    await restingOffset(page);

    await expectSelectedPage(page, 3);
    expect(await scrollLeft(page)).toBeGreaterThan(0);
  });
});

test.describe('page layout', () => {
  test('the footer holds the dots and the primary action at once', async ({ page }) => {
    await openStory(page, 'page-layout');
    const width = await pageWidth(page);

    // One Pagination slot, so there is no separate dot row above it.
    await expect(page.getByTestId('next-page')).toHaveText('Next page');
    await expect(page.getByTestId(/^dot-\d+$/)).toHaveCount(5);

    await page.getByTestId('next-page').click();

    expect(await restingOffset(page)).toBe(width);
    await expectSelectedPage(page, 1);
  });

  test('the track fills the height the screen gives it', async ({ page }) => {
    await openStory(page, 'page-layout');

    const heights = await page.evaluate(() => {
      const box = (selector: string) =>
        document.querySelector(selector)?.getBoundingClientRect().height ?? 0;
      const carousel = document.querySelector('[data-testid="carousel"]');
      return {
        screen: carousel?.parentElement?.getBoundingClientRect().height ?? 0,
        carousel: box('[data-testid="carousel"]'),
        track: box('[data-testid="carousel-track"]'),
        slide: box('[data-testid^="page-"]'),
        footer: box('[data-testid="next-page"]'),
      };
    });

    // Nothing in this screen states a height: the carousel takes what the top
    // bar leaves, the track takes what the footer leaves, and the slide
    // stretches to the track. A track sized by its content would come out
    // shorter than its own share of the screen.
    expect(heights.track).toBeGreaterThan(heights.screen / 2);
    expect(heights.slide).toBe(heights.track);
    expect(heights.track + heights.footer).toBeLessThanOrEqual(heights.carousel);
  });

  test('the primary action becomes a restart on the last page', async ({ page }) => {
    await openStory(page, 'page-layout');
    const next = page.getByTestId('next-page');

    for (let press = 0; press < 4; press++) {
      await next.click();
      await restingOffset(page);
    }

    await expectSelectedPage(page, 4);
    await expect(next).toHaveText('Start over');

    await next.click();

    expect(await restingOffset(page)).toBe(0);
    await expectSelectedPage(page, 0);
  });
});
