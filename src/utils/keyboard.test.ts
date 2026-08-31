import { keyAction, runKeyAction } from "./keyboard";

describe("keyAction", () => {
	it("pages with the arrow keys", () => {
		expect(keyAction("ArrowRight", false)).toBe("next");
		expect(keyAction("ArrowLeft", false)).toBe("previous");
	});

	it("mirrors the arrows when the layout is right to left", () => {
		expect(keyAction("ArrowRight", true)).toBe("previous");
		expect(keyAction("ArrowLeft", true)).toBe("next");
	});

	it("jumps to the ends with Home and End, in either direction", () => {
		for (const isRTL of [false, true]) {
			expect(keyAction("Home", isRTL)).toBe("first");
			expect(keyAction("End", isRTL)).toBe("last");
		}
	});

	it("leaves every other key alone", () => {
		for (const key of ["ArrowUp", "ArrowDown", "Tab", "Enter", " ", "a"]) {
			expect(keyAction(key, false)).toBeNull();
		}
	});
});

describe("runKeyAction", () => {
	const actions = () => ({
		next: jest.fn(),
		previous: jest.fn(),
		goTo: jest.fn(),
	});

	it("pages, and reports the key as handled", () => {
		const spies = actions();

		expect(runKeyAction("ArrowRight", false, 4, spies)).toBe(true);
		expect(spies.next).toHaveBeenCalledTimes(1);

		expect(runKeyAction("ArrowLeft", false, 4, spies)).toBe(true);
		expect(spies.previous).toHaveBeenCalledTimes(1);
	});

	it("sends Home and End to the first and last page", () => {
		const spies = actions();

		runKeyAction("Home", false, 4, spies);
		runKeyAction("End", false, 4, spies);

		expect(spies.goTo).toHaveBeenNthCalledWith(1, 0);
		expect(spies.goTo).toHaveBeenNthCalledWith(2, 3);
	});

	it("mirrors the arrows when the layout is right to left", () => {
		const spies = actions();

		runKeyAction("ArrowRight", true, 4, spies);

		expect(spies.previous).toHaveBeenCalledTimes(1);
		expect(spies.next).not.toHaveBeenCalled();
	});

	it("reports an unhandled key without touching the carousel", () => {
		const spies = actions();

		expect(runKeyAction("ArrowUp", false, 4, spies)).toBe(false);
		expect(spies.next).not.toHaveBeenCalled();
		expect(spies.previous).not.toHaveBeenCalled();
		expect(spies.goTo).not.toHaveBeenCalled();
	});
});
