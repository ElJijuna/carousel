import { expect, test } from '@playwright/test';
import { expectSelectedPage, openStory, restingOffset, track } from './helpers';

for (const effect of ['scale', 'fade', 'parallax'] as const) {
  for (const width of [390, 1000]) {
    test(`${effect} navigates at ${width}px without changing slide layout`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await openStory(page, effect);
      const initialWidth = await track(page).evaluate((el) => el.scrollWidth);
      await page.getByTestId('arrow-next').click();
      await restingOffset(page);
      await expectSelectedPage(page, 1);
      await page.getByTestId('dot-2').click();
      await restingOffset(page);
      await expectSelectedPage(page, 2);
      await track(page).focus();
      await page.keyboard.press('ArrowLeft');
      await restingOffset(page);
      await expectSelectedPage(page, 1);
      expect(await track(page).evaluate((el) => el.scrollWidth)).toBe(initialWidth);
      if (effect === 'parallax') {
        const bounds = await page.getByTestId('transition-meadow-viewport').boundingBox();
        const art = await page.getByTestId('transition-meadow-artwork').boundingBox();
        expect(bounds).not.toBeNull();
        expect(art).not.toBeNull();
        if (bounds && art) {
          expect(art.x).toBeLessThanOrEqual(bounds.x + 1);
          expect(art.x + art.width).toBeGreaterThanOrEqual(bounds.x + bounds.width - 1);
        }
      }
    });
  }

  test(`${effect} responds continuously during a partial scroll`, async ({ page }) => {
    await openStory(page, effect);
    const samples = await page.evaluate(async (selectedEffect) => {
      const scroller = document.querySelector('[data-testid="carousel-track"]') as HTMLElement;
      const card = document.querySelector('[data-testid="transition-tide"]') as HTMLElement;
      const art = document.querySelector('[data-testid="transition-tide-artwork"]') as HTMLElement;
      const read = () => {
        const style = getComputedStyle(card);
        if (selectedEffect === 'fade') {
          return Number(style.opacity);
        }
        const matrix = new DOMMatrixReadOnly(
          getComputedStyle(selectedEffect === 'scale' ? card : art).transform,
        );
        return selectedEffect === 'scale' ? matrix.a : matrix.m41;
      };
      const step = (card.getBoundingClientRect().width + 16) / 12;
      scroller.style.scrollSnapType = 'none';
      const values = [read()];
      for (let i = 0; i < 5; i++) {
        scroller.scrollLeft += step;
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await new Promise((resolve) => requestAnimationFrame(resolve));
        values.push(read());
        if (selectedEffect === 'parallax') {
          const bounds = card.getBoundingClientRect();
          const artwork = art.getBoundingClientRect();
          if (artwork.left > bounds.left + 1 || artwork.right < bounds.right - 1) {
            throw new Error('Parallax exposed an empty edge');
          }
        }
      }
      return values;
    }, effect);
    expect(new Set(samples.map((value) => value.toFixed(3))).size).toBeGreaterThan(2);
    if (effect === 'parallax') {
      expect(samples.at(-1)).toBeGreaterThan(0);
    } else {
      expect(samples.at(-1)).toBeLessThan(1);
      expect(samples.at(-1)).toBeGreaterThan(effect === 'scale' ? 0.9 : 0.35);
    }
  });

  test(`${effect} disables its visual effect when reduced motion changes`, async ({ page }) => {
    await openStory(page, effect);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect
      .poll(() =>
        page.getByTestId('transition-meadow').evaluate((el) => {
          const style = getComputedStyle(el);
          return [Number(style.opacity), new DOMMatrixReadOnly(style.transform).a];
        }),
      )
      .toEqual([1, 1]);
    await expect
      .poll(() =>
        page
          .getByTestId('transition-meadow-artwork')
          .evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41),
      )
      .toBe(0);
    await page.getByTestId('arrow-next').click();
    await expectSelectedPage(page, 1);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect
      .poll(() =>
        page
          .getByTestId(effect === 'parallax' ? 'transition-tide-artwork' : 'transition-tide')
          .evaluate((el, selectedEffect) => {
            const style = getComputedStyle(el);
            if (selectedEffect === 'fade') {
              return Number(style.opacity) !== 1;
            }
            const matrix = new DOMMatrixReadOnly(style.transform);
            return selectedEffect === 'scale' ? matrix.a !== 1 : matrix.m41 !== 0;
          }, effect),
      )
      .toBe(true);
  });
}
