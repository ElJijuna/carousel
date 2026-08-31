import { act, renderHook } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";

import { useReducedMotion } from "./useReducedMotion";

let listener: ((enabled: boolean) => void) | undefined;
const remove = jest.fn();

const mockAccessibility = (initial: boolean | Promise<boolean>) => {
	jest
		.spyOn(AccessibilityInfo, "isReduceMotionEnabled")
		.mockReturnValue(
			initial instanceof Promise ? initial : Promise.resolve(initial),
		);
	jest
		.spyOn(AccessibilityInfo, "addEventListener")
		.mockImplementation((_event, handler) => {
			listener = handler as (enabled: boolean) => void;
			return { remove } as unknown as ReturnType<
				typeof AccessibilityInfo.addEventListener
			>;
		});
};

beforeEach(() => {
	listener = undefined;
	remove.mockClear();
});

afterEach(() => {
	jest.restoreAllMocks();
});

it("reports the setting read on mount", async () => {
	mockAccessibility(true);
	const { result } = await renderHook(() => useReducedMotion());
	expect(result.current).toBe(true);
});

it("defaults to full motion", async () => {
	mockAccessibility(false);
	const { result } = await renderHook(() => useReducedMotion());
	expect(result.current).toBe(false);
});

it("follows the setting while mounted", async () => {
	mockAccessibility(false);
	const { result } = await renderHook(() => useReducedMotion());

	await act(async () => {
		listener?.(true);
	});
	expect(result.current).toBe(true);

	await act(async () => {
		listener?.(false);
	});
	expect(result.current).toBe(false);
});

it('treats an unsupported query as "no preference" rather than failing', async () => {
	// react-native-web rejects where the media feature is unavailable.
	mockAccessibility(Promise.reject(new Error("unsupported")));
	const { result } = await renderHook(() => useReducedMotion());
	expect(result.current).toBe(false);
});

it("unsubscribes on unmount", async () => {
	mockAccessibility(false);
	const { unmount } = await renderHook(() => useReducedMotion());

	await act(async () => {
		await unmount();
	});

	expect(remove).toHaveBeenCalled();
});
