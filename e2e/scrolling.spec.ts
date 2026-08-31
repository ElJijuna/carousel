import { expect, test } from "@playwright/test";

import {
	expectSelectedPage,
	openStory,
	pageWidth,
	restingOffset,
	scrollBy,
	scrollLeft,
} from "./helpers";

test("a user scroll snaps to a page and the chrome follows", async ({
	page,
}) => {
	await openStory(page, "basic");
	const width = await pageWidth(page);

	// Less than a full page: it still has to land on one, not between two.
	const offset = await scrollBy(page, width * 0.6);

	expect(offset).toBe(width);
	await expectSelectedPage(page, 1);
});

test("scrolling on keeps the page in step with the track", async ({ page }) => {
	await openStory(page, "basic");
	const width = await pageWidth(page);

	await scrollBy(page, width * 0.6);
	await expectSelectedPage(page, 1);

	const offset = await scrollBy(page, width * 2);

	expect(offset).toBe(width * 3);
	await expectSelectedPage(page, 3);
});

test("cannot be scrolled past the end", async ({ page }) => {
	await openStory(page, "basic");
	const width = await pageWidth(page);

	const offset = await scrollBy(page, width * 12);

	expect(offset).toBe(width * 3);
	await expectSelectedPage(page, 3);
});

test("peek leaves the neighbouring slides showing at the edges", async ({
	page,
}) => {
	await openStory(page, "peek-and-spacing");

	// The content is inset by `peek`, so a page boundary is not the viewport
	// width — the point of the prop is that the neighbours stay on screen.
	const inset = await page.evaluate(() => {
		const track = document.querySelector(
			'[data-testid="carousel-track"]',
		) as HTMLElement;
		const content = track.firstElementChild as HTMLElement;
		return Number.parseFloat(getComputedStyle(content).paddingLeft);
	});

	expect(inset).toBeGreaterThan(0);
	expect(await scrollLeft(page)).toBe(0);
});

test("the track snaps on page boundaries, not on every slide", async ({
	page,
}) => {
	await openStory(page, "peek-and-spacing");

	const alignments = await page.evaluate(() =>
		Array.from(document.querySelectorAll('[data-testid^="slide-"]')).map(
			(slide) =>
				getComputedStyle(slide.parentElement as HTMLElement).scrollSnapAlign,
		),
	);

	// Two slides per page, so every second slide is a snap point. Snapping on
	// each one instead would let a drag rest mid-page.
	expect(
		alignments.filter((value) => value === "start").length,
	).toBeGreaterThan(0);
	expect(alignments[0]).toBe("start");
	expect(alignments[1]).toBe("none");
});

test("a resize re-finds the page instead of keeping a stale pixel offset", async ({
	page,
}) => {
	await openStory(page, "basic");

	await page.getByTestId("dot-2").click();
	await restingOffset(page);
	const before = await pageWidth(page);

	await page.setViewportSize({ width: 520, height: 800 });
	await expect.poll(() => pageWidth(page)).not.toBe(before);

	const width = await pageWidth(page);
	// Page 2 is now at a different pixel offset, and that is where we are.
	expect(await restingOffset(page)).toBe(width * 2);
	await expectSelectedPage(page, 2);
});
