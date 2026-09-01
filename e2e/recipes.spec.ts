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

test.describe('day calendar', () => {
  test('the selected day survives paging to the next days', async ({ page }) => {
    await openStory(page, 'day-calendar');

    // Seven chips a page at this width, three pages of them, and the story
    // opens on the 13th.
    await expect(page.getByTestId('strip-readout')).toHaveText('9 – 15');
    await expect(page.getByTestId('day-13-selected')).toBeVisible();
    await expect(page.getByTestId('day-agenda-heading')).toContainText('Friday 13 August');

    await page.getByTestId('day-11').click();

    await expect(page.getByTestId('day-11-selected')).toBeVisible();
    await expect(page.getByTestId('day-agenda-heading')).toContainText('Wednesday 11 August');
    // Picking a day is not paging: the strip stays where it was.
    expect(await scrollLeft(page)).toBe(0);

    await page.getByTestId('strip-next').click();
    const width = await pageWidth(page);

    // A page plus the `spacing` between the last chip of one week and the
    // first of the next — the stride the strip actually advances by.
    expect(await restingOffset(page)).toBe(width + 8);
    await expect(page.getByTestId('strip-readout')).toHaveText('16 – 22');
    // …and paging is not picking: the panel still shows the day that was chosen.
    await expect(page.getByTestId('day-agenda-heading')).toContainText('Wednesday 11 August');
  });

  test('a day with nothing on it gets an empty panel, not an empty space', async ({ page }) => {
    await openStory(page, 'day-calendar');

    await page.getByTestId('day-15').click();

    await expect(page.getByTestId('day-agenda-empty')).toBeVisible();
    await expect(page.getByTestId(/^entry-/)).toHaveCount(0);
  });
});

test.describe('coverflow', () => {
  /**
   * The horizontal scale a card is currently drawn at.
   *
   * `.first()` because `infinite` renders a clone of each end, which repeats
   * the testID; the first match is the real slide, since the leading clone is
   * a copy of the *last* card.
   */
  const scaleOf = (page: Parameters<typeof pageWidth>[0], id: string): Promise<number> =>
    page
      .getByTestId(`cover-${id}`)
      .first()
      .evaluate((el) => {
        const matrix = new DOMMatrixReadOnly(getComputedStyle(el).transform);
        return Number(matrix.a.toFixed(2));
      });

  test('scales each card by how far it is from the front', async ({ page }) => {
    await openStory(page, 'coverflow');

    expect(await scaleOf(page, 'tide')).toBe(1);
    expect(await scaleOf(page, 'meadow')).toBeLessThan(1);
    await expect(page.getByTestId('cover-tide-active').first()).toBeVisible();

    await page.getByTestId('arrow-next').click();
    await restingOffset(page);

    // The roles swap: nothing here is a per-slide flag the story maintains,
    // only `progress` read from where each slide happens to be.
    expect(await scaleOf(page, 'meadow')).toBe(1);
    expect(await scaleOf(page, 'tide')).toBeLessThan(1);
    await expect(page.getByTestId('cover-meadow-active').first()).toBeVisible();
  });

  test('follows the scroll continuously, not in two steps', async ({ page }) => {
    await openStory(page, 'coverflow');
    const resting = await scaleOf(page, 'meadow');

    // Sampled inside one evaluate, mid-scroll, for two reasons: assigning
    // `scrollLeft` on a scroll-snap container gets re-snapped unless snapping
    // comes off, and a track that stops scrolling settles onto the nearest
    // page a moment later — so a reading taken afterwards is always one of the
    // two resting values, and would pass against a two-state effect.
    const samples = await page.evaluate(
      async (step: number) => {
        const track = document.querySelector('[data-testid="carousel-track"]') as HTMLElement;
        const card = document.querySelector('[data-testid="cover-meadow"]') as HTMLElement;
        const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
        const scale = () => new DOMMatrixReadOnly(getComputedStyle(card).transform).a;

        track.style.scrollSnapType = 'none';
        const readings: number[] = [];
        for (let taken = 0; taken < 6; taken++) {
          track.scrollLeft += step;
          await frame();
          readings.push(Number(scale().toFixed(2)));
        }
        return readings;
      },
      Math.round((await pageWidth(page)) / 12),
    );

    // Every reading between the two resting states, and always growing: the
    // card comes forward with the scroll rather than jumping when it arrives.
    expect(samples.every((scale, index) => index === 0 || scale >= (samples[index - 1] ?? 0))).toBe(
      true,
    );
    expect(samples.some((scale) => scale > resting && scale < 1)).toBe(true);
  });
});

test.describe('gallery', () => {
  /** Where the thumbnail strip — the second carousel — is scrolled to. */
  const stripOffset = (page: Parameters<typeof pageWidth>[0]): Promise<number> =>
    page.evaluate(() =>
      Math.round(
        (document.querySelector('[data-testid="thumbs-track"]') as HTMLElement).scrollLeft,
      ),
    );

  test('a thumbnail moves the picture, and the picture moves the highlight', async ({ page }) => {
    await openStory(page, 'gallery');

    await expect(page.getByTestId('fraction')).toHaveText('1 / 10');
    await expect(page.getByTestId('thumb-pier-selected')).toBeVisible();

    await page.getByTestId('thumb-sunrise').click();
    await restingOffset(page);

    await expect(page.getByTestId('fraction')).toHaveText('3 / 10');
    await expect(page.getByTestId('thumb-sunrise-selected')).toBeVisible();

    // The other direction: the picture's own arrow moves the highlight, which
    // is the half a two-carousel gallery usually gets wrong.
    await page.getByTestId('arrow-next').click();
    await restingOffset(page);

    await expect(page.getByTestId('fraction')).toHaveText('4 / 10');
    await expect(page.getByTestId('thumb-streetlight-selected')).toBeVisible();
  });

  test('the strip scrolls only once the selection leaves it', async ({ page }) => {
    await openStory(page, 'gallery');
    expect(await stripOffset(page)).toBe(0);

    // Photo 3 is on the strip's first page, so nothing needs to move: the
    // effect calls `goToSlide`, and `goToSlide` is a no-op for a slide that is
    // already on the current page.
    await page.getByTestId('thumb-sunrise').click();
    await restingOffset(page);
    expect(await stripOffset(page)).toBe(0);

    // Past the fifth photo the strip has to follow, or the highlight would be
    // marking a thumbnail nobody can see.
    for (let press = 0; press < 4; press++) {
      await page.getByTestId('arrow-next').click();
      await restingOffset(page);
    }

    await expect(page.getByTestId('fraction')).toHaveText('7 / 10');
    await expect(page.getByTestId('thumb-frost-selected')).toBeVisible();
    await expect.poll(() => stripOffset(page)).toBeGreaterThan(0);
  });
});
