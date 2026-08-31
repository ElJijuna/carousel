/**
 * Keyboard mapping for the track.
 *
 * Only the web has a scroll container that takes focus, so this is the one
 * place a key press reaches the carousel — but the mapping itself is pure, and
 * lives here so it can be tested without a browser.
 *
 * @module
 */

/** What a handled key press asks the carousel to do. */
export type CarouselKeyAction = "next" | "previous" | "first" | "last";

/**
 * The action a key press maps to, or `null` for a key the carousel does not
 * handle — which is most of them, and which the caller must leave to the
 * browser rather than swallow.
 *
 * The arrows are mirrored under `isRTL`: page indices stay logical everywhere
 * in this library, but a key named for a direction means the direction the user
 * sees, and in a right-to-left deck the next page is to the left.
 */
export const keyAction = (
	key: string,
	isRTL: boolean,
): CarouselKeyAction | null => {
	switch (key) {
		case "ArrowRight":
			return isRTL ? "previous" : "next";
		case "ArrowLeft":
			return isRTL ? "next" : "previous";
		case "Home":
			return "first";
		case "End":
			return "last";
		default:
			return null;
	}
};

/** The navigation a key press can reach. */
export interface CarouselKeyActions {
	next: () => void;
	previous: () => void;
	goTo: (page: number) => void;
}

/**
 * Run whatever `key` maps to and report whether it was handled.
 *
 * The boolean is the useful half: a caller takes a handled key away from the
 * browser and leaves an unhandled one alone, so the deck never swallows a key
 * it does not act on.
 */
export const runKeyAction = (
	key: string,
	isRTL: boolean,
	pageCount: number,
	actions: CarouselKeyActions,
): boolean => {
	const action = keyAction(key, isRTL);
	if (action === null) {
		return false;
	}

	if (action === "next") {
		actions.next();
	} else if (action === "previous") {
		actions.previous();
	} else {
		actions.goTo(action === "first" ? 0 : pageCount - 1);
	}
	return true;
};
