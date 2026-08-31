import { expect, test } from '@playwright/test';

import {
  expectSelectedPage,
  openStory,
  pageWidth,
  restingOffset,
  scrollLeft,
  track,
} from './helpers';

test.describe('dots', () => {
  test('pressing a dot really scrolls the track', async ({ page }) => {
    await openStory(page, 'basic');
    const width = await pageWidth(page);

    expect(await scrollLeft(page)).toBe(0);

    await page.getByTestId('dot-2').click();

    // The unit tests stop at "the state says page 2"; this is the round trip
    // through a real scroll container.
    expect(await restingOffset(page)).toBe(width * 2);
    await expectSelectedPage(page, 2);
  });

  test('comes back to the first page', async ({ page }) => {
    await openStory(page, 'basic');

    await page.getByTestId('dot-3').click();
    await restingOffset(page);

    await page.getByTestId('dot-0').click();

    expect(await restingOffset(page)).toBe(0);
    await expectSelectedPage(page, 0);
  });
});

test.describe('arrows', () => {
  test('page forward and back', async ({ page }) => {
    await openStory(page, 'with-arrows');
    const width = await pageWidth(page);

    await page.getByTestId('arrow-next').click();
    expect(await restingOffset(page)).toBe(width);
    await expectSelectedPage(page, 1);

    await page.getByTestId('arrow-previous').click();
    expect(await restingOffset(page)).toBe(0);
    await expectSelectedPage(page, 0);
  });

  test('the previous arrow stays on screen but inert on the first page', async ({ page }) => {
    await openStory(page, 'with-arrows');

    const previous = page.getByTestId('arrow-previous');
    // Still present and focusable: a control that unmounts under the finger
    // pressing it takes the user's place in the deck with it.
    await expect(previous).toBeVisible();
    await expect(page.getByTestId('arrow-previous-disabled')).toBeVisible();

    await previous.click();

    expect(await restingOffset(page)).toBe(0);
    await expectSelectedPage(page, 0);
  });

  test('the next arrow goes inert on the last page', async ({ page }) => {
    await openStory(page, 'with-arrows');
    const next = page.getByTestId('arrow-next');

    for (let i = 0; i < 3; i += 1) {
      await next.click();
      await restingOffset(page);
    }
    await expectSelectedPage(page, 3);
    const atEnd = await scrollLeft(page);

    await expect(page.getByTestId('arrow-next-disabled')).toBeVisible();
    await next.click();

    expect(await restingOffset(page)).toBe(atEnd);
  });

  test('both arrows stay live when the carousel loops', async ({ page }) => {
    await openStory(page, 'loop');

    await expect(page.getByTestId('arrow-previous-enabled')).toBeVisible();

    // Stepping back from page 0 rewinds to the last page.
    await page.getByTestId('arrow-previous').click();
    await restingOffset(page);

    await expectSelectedPage(page, 3);
    expect(await scrollLeft(page)).toBeGreaterThan(0);
  });
});

test.describe('grouped pages', () => {
  test('advance a whole group at a time', async ({ page }) => {
    await openStory(page, 'visible-slides');

    // 6 slides at 3 per page make 2 pages, not 6.
    await expect(page.getByTestId(/^dot-\d+$/)).toHaveCount(2);

    await page.getByTestId('arrow-next').click();
    await restingOffset(page);

    await expectSelectedPage(page, 1);
    // Every slide stays mounted in the children mode; only the track moved.
    await expect(page.getByTestId('slide-5')).toBeAttached();
  });
});

test.describe('keyboard', () => {
  test('the track takes focus, so a keyboard can reach it at all', async ({ page }) => {
    await openStory(page, 'basic');

    // Tab from the top of the document rather than calling `focus()`: the
    // point is that the track is *in* the tab order, which a scroll container
    // is not by default.
    await page.keyboard.press('Tab');

    await expect(track(page)).toBeFocused();
  });

  test('arrow keys page the track', async ({ page }) => {
    await openStory(page, 'basic');
    const width = await pageWidth(page);
    await track(page).focus();

    await page.keyboard.press('ArrowRight');
    expect(await restingOffset(page)).toBe(width);
    await expectSelectedPage(page, 1);

    await page.keyboard.press('ArrowLeft');
    expect(await restingOffset(page)).toBe(0);
    await expectSelectedPage(page, 0);
  });

  test('Home and End jump to the ends', async ({ page }) => {
    await openStory(page, 'basic');
    const width = await pageWidth(page);
    await track(page).focus();

    await page.keyboard.press('End');
    expect(await restingOffset(page)).toBe(width * 3);
    await expectSelectedPage(page, 3);

    await page.keyboard.press('Home');
    expect(await restingOffset(page)).toBe(0);
    await expectSelectedPage(page, 0);
  });

  test('keys the carousel does not handle are left to the browser', async ({ page }) => {
    await openStory(page, 'basic');
    await track(page).focus();

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // A vertical key on a horizontal deck must not page it, and must not be
    // swallowed either — the browser keeps whatever it would have done.
    expect(await scrollLeft(page)).toBe(0);
    await expectSelectedPage(page, 0);
  });
});
