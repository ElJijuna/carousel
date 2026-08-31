import { expect, test } from "@playwright/test";

import { openStory } from "./helpers";

/**
 * Visual regression for the stories whose whole point is how they look.
 *
 * The rest of this suite asserts behaviour, and behaviour survives a card that
 * has lost its image, a footer that has slid off the bottom or copy that has
 * stopped being clamped — these catch that.
 *
 * Baselines live in `e2e/__screenshots__/<platform>/` and are per-platform:
 * regenerate yours with `npm run test:visual -- --update-snapshots`, and read
 * the diff before committing it.
 *
 * @module
 */

/** Stories that exist to show a layout, with the id Storybook gives them. */
const looks = [
	"basic",
	"with-arrows",
	"split-cards",
	"credit-cards",
	"page-layout",
] as const;

for (const story of looks) {
	test(`${story} looks the way it did`, async ({ page }) => {
		await openStory(page, story);
		// The track animates into place on mount, and the images are data URIs
		// that decode a frame later.
		await expect(page.getByTestId("carousel-track")).toBeVisible();
		await page.waitForTimeout(500);

		await expect(page).toHaveScreenshot(`${story}.png`, {
			// Rules out a caret or an in-flight transition being the difference.
			animations: "disabled",
			caret: "hide",
		});
	});
}
