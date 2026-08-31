import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Shared helpers for the e2e suite.
 *
 * Every spec drives the real component inside a react-native-web Storybook, so
 * these exercise what the unit tests deliberately cannot: a genuine scroll
 * container, with real layout, real scroll offsets and real snapping.
 *
 * @module
 */

const TRACK = '[data-testid="carousel-track"]';

/** Open a story by its Storybook id, without the manager chrome around it. */
export async function openStory(page: Page, id: string): Promise<void> {
	await page.goto(`/iframe.html?id=carousel--${id}&viewMode=story`);
	await expect(track(page)).toBeVisible();
	// The carousel measures itself with `onLayout`, so nothing is positioned
	// until a real width has arrived and the content has been sized against it.
	await expect.poll(() => contentWidth(page)).toBeGreaterThan(0);
}

export const track = (page: Page): Locator =>
	page.getByTestId("carousel-track");

/** The track's current horizontal scroll offset. */
export const scrollLeft = (page: Page): Promise<number> =>
	page.evaluate(
		(sel) => (document.querySelector(sel) as HTMLElement).scrollLeft,
		TRACK,
	);

const contentWidth = (page: Page): Promise<number> =>
	page.evaluate(
		(sel) => (document.querySelector(sel) as HTMLElement).scrollWidth,
		TRACK,
	);

/** Width of one page in pixels, derived from the track's own layout. */
export const pageWidth = (page: Page): Promise<number> =>
	page.evaluate(
		(sel) => (document.querySelector(sel) as HTMLElement).clientWidth,
		TRACK,
	);

/** Wait for the track to stop moving, then report where it came to rest. */
export async function restingOffset(page: Page): Promise<number> {
	let previous = Number.NaN;
	await expect
		.poll(
			async () => {
				const current = await scrollLeft(page);
				const settled = current === previous;
				previous = current;
				return settled;
			},
			{ timeout: 8000, intervals: [120, 120, 200, 300] },
		)
		.toBe(true);
	return scrollLeft(page);
}

/**
 * Scroll the track the way a user would.
 *
 * A wheel event, not a mouse drag: a browser does not scroll a container by
 * dragging inside it, so a synthesised drag would assert nothing at all.
 */
export async function scrollBy(page: Page, deltaX: number): Promise<number> {
	await track(page).hover();
	await page.mouse.wheel(deltaX, 0);
	return restingOffset(page);
}

/** Whether the dot for `index` is currently marked as the selected page. */
export const dotSelected = async (
	page: Page,
	index: number,
): Promise<boolean> =>
	(await page.getByTestId(`dot-${index}-selected`).count()) > 0;

/** Assert that exactly the given page's dot reads as selected. */
export async function expectSelectedPage(
	page: Page,
	index: number,
): Promise<void> {
	await expect.poll(() => dotSelected(page, index)).toBe(true);
	await expect(page.getByTestId(/^dot-\d+-selected$/)).toHaveCount(1);
}
