import { expect, test } from "@playwright/test";

import {
	expectSelectedPage,
	openStory,
	pageWidth,
	restingOffset,
	scrollLeft,
} from "./helpers";

test.describe("dots", () => {
	test("pressing a dot really scrolls the track", async ({ page }) => {
		await openStory(page, "basic");
		const width = await pageWidth(page);

		expect(await scrollLeft(page)).toBe(0);

		await page.getByTestId("dot-2").click();

		// The unit tests stop at "the state says page 2"; this is the round trip
		// through a real scroll container.
		expect(await restingOffset(page)).toBe(width * 2);
		await expectSelectedPage(page, 2);
	});

	test("comes back to the first page", async ({ page }) => {
		await openStory(page, "basic");

		await page.getByTestId("dot-3").click();
		await restingOffset(page);

		await page.getByTestId("dot-0").click();

		expect(await restingOffset(page)).toBe(0);
		await expectSelectedPage(page, 0);
	});
});

test.describe("arrows", () => {
	test("page forward and back", async ({ page }) => {
		await openStory(page, "with-arrows");
		const width = await pageWidth(page);

		await page.getByTestId("arrow-next").click();
		expect(await restingOffset(page)).toBe(width);
		await expectSelectedPage(page, 1);

		await page.getByTestId("arrow-previous").click();
		expect(await restingOffset(page)).toBe(0);
		await expectSelectedPage(page, 0);
	});

	test("the previous arrow stays on screen but inert on the first page", async ({
		page,
	}) => {
		await openStory(page, "with-arrows");

		const previous = page.getByTestId("arrow-previous");
		// Still present and focusable: a control that unmounts under the finger
		// pressing it takes the user's place in the deck with it.
		await expect(previous).toBeVisible();
		await expect(page.getByTestId("arrow-previous-disabled")).toBeVisible();

		await previous.click();

		expect(await restingOffset(page)).toBe(0);
		await expectSelectedPage(page, 0);
	});

	test("the next arrow goes inert on the last page", async ({ page }) => {
		await openStory(page, "with-arrows");
		const next = page.getByTestId("arrow-next");

		for (let i = 0; i < 3; i += 1) {
			await next.click();
			await restingOffset(page);
		}
		await expectSelectedPage(page, 3);
		const atEnd = await scrollLeft(page);

		await expect(page.getByTestId("arrow-next-disabled")).toBeVisible();
		await next.click();

		expect(await restingOffset(page)).toBe(atEnd);
	});

	test("both arrows stay live when the carousel loops", async ({ page }) => {
		await openStory(page, "loop");

		await expect(page.getByTestId("arrow-previous-enabled")).toBeVisible();

		// Stepping back from page 0 rewinds to the last page.
		await page.getByTestId("arrow-previous").click();
		await restingOffset(page);

		await expectSelectedPage(page, 3);
		expect(await scrollLeft(page)).toBeGreaterThan(0);
	});
});

test.describe("grouped pages", () => {
	test("advance a whole group at a time", async ({ page }) => {
		await openStory(page, "visible-slides");

		// 6 slides at 3 per page make 2 pages, not 6.
		await expect(page.getByTestId(/^dot-\d+$/)).toHaveCount(2);

		await page.getByTestId("arrow-next").click();
		await restingOffset(page);

		await expectSelectedPage(page, 1);
		// Every slide stays mounted in the children mode; only the track moved.
		await expect(page.getByTestId("slide-5")).toBeAttached();
	});
});
