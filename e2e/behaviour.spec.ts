import { expect, test } from "@playwright/test";

import {
	expectSelectedPage,
	openStory,
	restingOffset,
	scrollLeft,
} from "./helpers";

test.describe("infinite", () => {
	test("starts past the leading clone", async ({ page }) => {
		await openStory(page, "infinite");

		// Page 0 sits one page in, so there is a slide to the left to come from.
		expect(await scrollLeft(page)).toBeGreaterThan(0);
		await expectSelectedPage(page, 0);
	});

	test("renders a clone page at each end, hidden from assistive tech", async ({
		page,
	}) => {
		await openStory(page, "infinite");

		// 6 real slides + one cloned page (2 slides) at each end.
		await expect(page.getByTestId(/^slide-\d+$/)).toHaveCount(10);
		// Only the real ones are named for a screen reader.
		await expect(page.getByLabel(/^\d+ of 6$/)).toHaveCount(6);
	});

	test("wraps forward past the end and lands back on page 0", async ({
		page,
	}) => {
		await openStory(page, "infinite");
		const start = await scrollLeft(page);

		// 6 slides at 2 per page: three presses go all the way round.
		for (let i = 0; i < 3; i += 1) {
			await page.getByTestId("arrow-next").click();
			await restingOffset(page);
		}

		// Travelled through the trailing clone, then silently re-anchored onto the
		// real first page — same pixel offset it started from.
		expect(await restingOffset(page)).toBe(start);
		await expectSelectedPage(page, 0);
	});

	test("wraps backward past the start and lands on the last page", async ({
		page,
	}) => {
		await openStory(page, "infinite");

		await page.getByTestId("arrow-previous").click();
		await restingOffset(page);

		await expectSelectedPage(page, 2);
		// Re-anchored onto the real last page, not left parked on the clone.
		expect(await scrollLeft(page)).toBeGreaterThan(0);
	});
});

test.describe("autoPlay", () => {
	test("advances on its own and the control stops it", async ({ page }) => {
		await openStory(page, "auto-play");

		await expect
			.poll(() => scrollLeft(page), { timeout: 8000 })
			.toBeGreaterThan(0);

		await page.getByTestId("play-pause").click();
		const paused = await restingOffset(page);

		// Give it more than two intervals to prove it really stopped.
		await page.waitForTimeout(5000);
		expect(await scrollLeft(page)).toBe(paused);
	});

	test("resumes when the control is pressed again", async ({ page }) => {
		await openStory(page, "auto-play");

		await page.getByTestId("play-pause").click();
		const paused = await restingOffset(page);

		await page.getByTestId("play-pause").click();

		await expect
			.poll(() => scrollLeft(page), { timeout: 8000 })
			.not.toBe(paused);
	});
});

test.describe("controlled", () => {
	test("the parent owns the page", async ({ page }) => {
		await openStory(page, "controlled");

		await page.getByTestId("external-last").click();
		await restingOffset(page);

		await expect(page.getByTestId("page-readout")).toHaveText("page 4");
		await expectSelectedPage(page, 4);

		await page.getByTestId("external-first").click();

		expect(await restingOffset(page)).toBe(0);
		await expect(page.getByTestId("page-readout")).toHaveText("page 0");
	});

	test("a move inside the carousel is reported back to the parent", async ({
		page,
	}) => {
		await openStory(page, "controlled");

		await page.getByTestId("arrow-next").click();
		await restingOffset(page);

		// The story feeds `onPageChanged` straight back into `page`.
		await expect(page.getByTestId("page-readout")).toHaveText("page 1");
	});
});

test.describe("imperative handle", () => {
	test("drives the carousel from a toolbar outside it", async ({ page }) => {
		await openStory(page, "imperative-handle");

		await page.getByTestId("handle-next").click();
		await restingOffset(page);
		await expectSelectedPage(page, 1);
		await expect(page.getByTestId("handle-readout")).toHaveText("page 1");

		await page.getByTestId("handle-previous").click();
		await restingOffset(page);
		await expectSelectedPage(page, 0);

		// Wrapping, because the story sets `loop`.
		await page.getByTestId("handle-previous").click();
		await restingOffset(page);
		await expectSelectedPage(page, 5);
	});

	test("goToSlide targets the page holding a slide", async ({ page }) => {
		await openStory(page, "imperative-handle");

		await page.getByTestId("handle-slide").click();
		await restingOffset(page);

		// One slide per page here, so slide 5 is page 4.
		await expectSelectedPage(page, 4);
		await expect(page.getByTestId("handle-readout")).toHaveText("page 4");
	});
});

test.describe("headless contract", () => {
	test("renders no chrome at all when no slots are given", async ({ page }) => {
		await openStory(page, "no-chrome");

		await expect(page.getByTestId(/^dot-/)).toHaveCount(0);
		await expect(page.getByTestId(/^arrow-/)).toHaveCount(0);
		await expect(page.getByTestId("play-pause")).toHaveCount(0);
		// But the track is there and scrollable.
		await expect(page.getByTestId("carousel-track")).toBeVisible();
	});

	test("a Pagination slot replaces the whole dot row", async ({ page }) => {
		await openStory(page, "fraction-pagination");

		await expect(page.getByTestId("fraction")).toHaveText("1 / 8");
		await expect(page.getByTestId(/^dot-/)).toHaveCount(0);

		await page.getByTestId("arrow-next").click();
		await restingOffset(page);

		await expect(page.getByTestId("fraction")).toHaveText("2 / 8");
	});

	test("custom chrome built on useCarousel drives the same state", async ({
		page,
	}) => {
		await openStory(page, "custom-chrome-via-hook");

		const fillWidth = () =>
			page.evaluate(
				() =>
					(
						document.querySelector(
							'[data-testid="progress-fill"]',
						) as HTMLElement
					).offsetWidth,
			);
		const before = await fillWidth();

		await page.getByTestId("hook-next").click();
		await restingOffset(page);

		expect(await fillWidth()).toBeGreaterThan(before);
	});
});

test.describe("virtualized", () => {
	test("mounts only a window of a 500-slide deck", async ({ page }) => {
		await openStory(page, "virtualized");

		const mounted = await page.getByTestId(/^slide-\d+$/).count();
		expect(mounted).toBeGreaterThan(0);
		// The whole point: 500 slides must not become 500 mounted views.
		expect(mounted).toBeLessThan(100);
		await expect(page.getByTestId("fraction")).toHaveText("1 / 250");
	});

	test("pages the same way the children mode does", async ({ page }) => {
		await openStory(page, "virtualized");

		await page.getByTestId("arrow-next").click();
		await restingOffset(page);

		await expect(page.getByTestId("fraction")).toHaveText("2 / 250");
		expect(await scrollLeft(page)).toBeGreaterThan(0);
	});
});

test.describe("responsive", () => {
	test("regroups the pages when the carousel is given less room", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1000, height: 800 });
		await openStory(page, "responsive");

		// The story frame caps the carousel at 720dp, so even on a 1000px viewport
		// it lands in the `700` bucket: 9 slides at 2 per page make 5 pages. That
		// is the whole point — the map resolves against the carousel's own width,
		// not the window's.
		await expect(page.getByTestId(/^dot-\d+$/)).toHaveCount(5);

		await page.setViewportSize({ width: 420, height: 800 });

		// Narrow enough for the `460` bucket now: one slide per page.
		await expect(page.getByTestId(/^dot-\d+$/)).toHaveCount(9);
	});
});
