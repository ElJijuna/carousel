import { expect, type Page, test } from '@playwright/test';
import { expectSelectedPage, openStory, track } from './helpers';

async function drag(page: Page, fraction: number) {
  const bounds = await track(page).boundingBox();
  if (!bounds) {
    throw new Error('Card track has no bounds');
  }
  const x = bounds.x + bounds.width * (fraction < 0 ? 0.8 : 0.2);
  const y = bounds.y + bounds.height * 0.8;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + bounds.width * fraction, y, { steps: 12 });
  await page.mouse.up();
}

async function expectFace(page: Page, index: number) {
  await expect(track(page).getByTestId(`carousel-track-face-${index}`)).toHaveAttribute(
    'aria-label',
    `${index + 1} of 3`,
  );
  await expect(track(page).locator('[data-testid*="-face-"]')).toHaveCount(1);
  await expectSelectedPage(page, index);
}

test('mouse swipes keep the cards stationary and wrap in both directions', async ({ page }) => {
  await openStory(page, 'card');
  const original = await track(page).boundingBox();
  for (const index of [1, 2, 0, 1]) {
    await drag(page, -0.35);
    await expectFace(page, index);
  }
  for (const index of [0, 2, 1, 0]) {
    await drag(page, 0.35);
    await expectFace(page, index);
  }
  expect(await track(page).boundingBox()).toEqual(original);
  expect(await track(page).evaluate((element) => element.scrollLeft)).toBe(0);
});

test('short drags cancel, finite swipes stop, and controls can loop', async ({ page }) => {
  await openStory(page, 'card', 'infinite:false;loop:true');
  await drag(page, -0.15);
  await expectFace(page, 0);
  await drag(page, 0.35);
  await expectFace(page, 0);
  await page.getByTestId('dot-2').click();
  await expectFace(page, 2);
  await drag(page, -0.35);
  await expectFace(page, 2);
  await page.getByTestId('arrow-next').click();
  await expectFace(page, 0);
});

test('partial drags rotate centrally and expose only the visible face', async ({ page }) => {
  await openStory(page, 'card');
  const bounds = await track(page).boundingBox();
  if (!bounds) {
    throw new Error('Card track has no bounds');
  }
  const x = bounds.x + bounds.width * 0.8;
  const y = bounds.y + bounds.height * 0.8;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - bounds.width * 0.3, y, { steps: 12 });
  const front = page.getByTestId('carousel-track-face-0');
  const back = page.getByTestId('carousel-track-face-1');
  await expect(back).toHaveAttribute('aria-hidden', 'true');
  const matrix = await front.evaluate((element) => {
    const style = getComputedStyle(element);
    const transform = new DOMMatrixReadOnly(style.transform);
    return { cosine: transform.m11, x: transform.m41, backface: style.backfaceVisibility };
  });
  expect(matrix.cosine).toBeLessThan(0.9);
  expect(matrix.cosine).toBeGreaterThan(0);
  expect(matrix.x).toBe(0);
  expect(matrix.backface).toBe('hidden');
  await page.mouse.up();
  await expectFace(page, 1);
});

test('keyboard navigation and reduced motion show the destination directly', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openStory(page, 'card');
  await track(page).focus();
  await page.keyboard.press('ArrowRight');
  await expectFace(page, 1);
  const transform = await page
    .getByTestId('carousel-track-face-1')
    .evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m11);
  expect(transform).toBe(1);
  await page.keyboard.press('End');
  await expectFace(page, 2);
});

test('touch swipes reveal the chart and keep looping', async ({ page, context }) => {
  await openStory(page, 'card');
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true });
  for (const index of [1, 2, 0]) {
    const bounds = await track(page).boundingBox();
    if (!bounds) {
      throw new Error('Card track has no bounds');
    }
    const x = bounds.x + bounds.width * 0.8;
    const y = bounds.y + bounds.height * 0.8;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let step = 1; step <= 10; step++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: x - bounds.width * 0.035 * step, y }],
      });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expectFace(page, index);
  }
});
