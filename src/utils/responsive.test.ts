import { resolveResponsive } from "./responsive";

describe("resolveResponsive", () => {
	it("returns the fallback when the prop is undefined", () => {
		expect(resolveResponsive(undefined, 500, 7)).toBe(7);
	});

	it("returns a plain value unchanged, whatever the width", () => {
		expect(resolveResponsive(3, 0, 1)).toBe(3);
		expect(resolveResponsive(3, 9999, 1)).toBe(3);
	});

	it("picks the narrowest bucket the container still fits under", () => {
		const map = { base: 3, 700: 2, 400: 1 };
		expect(resolveResponsive(map, 320, 0)).toBe(1);
		expect(resolveResponsive(map, 400, 0)).toBe(1);
		expect(resolveResponsive(map, 401, 0)).toBe(2);
		expect(resolveResponsive(map, 700, 0)).toBe(2);
		expect(resolveResponsive(map, 701, 0)).toBe(3);
	});

	it("falls outwards to the next wider bucket when one is missing", () => {
		// No `medium` entry, so a 550dp container keeps the 860 value.
		const map = { base: 4, 860: 2 };
		expect(resolveResponsive(map, 550, 0)).toBe(2);
		expect(resolveResponsive(map, 900, 0)).toBe(4);
	});

	it("uses base before the first layout pass rather than the narrowest bucket", () => {
		// Width 0 matches every max-width key; answering with `1` here would make
		// the carousel reflow visibly on the very next frame.
		expect(resolveResponsive({ base: 3, 400: 1 }, 0, 0)).toBe(3);
	});

	it("falls back when the map has no matching entry and no usable base", () => {
		const map = { 400: 1 } as unknown as { base: number; [k: number]: number };
		expect(resolveResponsive(map, 900, 42)).toBe(42);
	});

	it("ignores non-numeric keys other than base", () => {
		const map = { base: 3, wide: 9, 400: 1 } as unknown as {
			base: number;
			[k: number]: number;
		};
		expect(resolveResponsive(map, 900, 0)).toBe(3);
	});

	it("resolves string values too", () => {
		expect(resolveResponsive({ base: "a", 400: "b" }, 300, "z")).toBe("b");
	});
});
