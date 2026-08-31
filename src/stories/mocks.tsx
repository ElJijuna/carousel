/**
 * Mocked chrome for the stories.
 *
 * `@real-native/carousel` ships no UI on purpose, so the Storybook has to bring
 * its own. Everything here is a plain React Native component that takes the
 * carousel's slot props — the same shape an implementer writes in their own
 * design system. Copy any of it as a starting point.
 *
 * @module
 */
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type {
	CarouselArrowSlotProps,
	CarouselDotSlotProps,
	CarouselPaginationSlotProps,
	CarouselPlayPauseSlotProps,
} from "../types";

/** Shared colours for the mocked chrome, so the stories stay literal-free. */
export const palette = {
	ink: "#111827",
	muted: "#9ca3af",
	surface: "#ffffff",
	accent: "#2563eb",
	slideBg: "#e0e7ff",
	slideBorder: "#c7d2fe",
	caption: "#4b5563",
	track: "#e5e7eb",
	shadow: "#000000",
};

const styles = StyleSheet.create({
	arrow: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: palette.surface,
		marginHorizontal: 8,
		shadowColor: palette.shadow,
		shadowOpacity: 0.15,
		shadowRadius: 6,
		shadowOffset: { width: 0, height: 2 },
		elevation: 3,
	},
	arrowDisabled: { opacity: 0.35 },
	arrowGlyph: { fontSize: 18, color: palette.ink, lineHeight: 20 },

	dot: {
		width: 24,
		height: 24,
		alignItems: "center",
		justifyContent: "center",
	},
	dotInner: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: palette.muted,
	},
	dotSelected: { backgroundColor: palette.accent, width: 20 },

	fraction: {
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 999,
		backgroundColor: palette.ink,
		alignSelf: "center",
	},
	fractionText: {
		color: palette.surface,
		fontVariant: ["tabular-nums"],
		fontSize: 13,
	},

	playPause: {
		margin: 12,
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 999,
		backgroundColor: palette.surface,
	},
	playPauseText: { fontSize: 12, color: palette.ink },

	slide: {
		height: 160,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: palette.slideBorder,
		backgroundColor: palette.slideBg,
		alignItems: "center",
		justifyContent: "center",
	},
	slideTitle: { fontSize: 22, fontWeight: "600", color: palette.ink },
	slideCaption: { fontSize: 13, color: palette.caption, marginTop: 4 },
});

/** Round arrow button. Goes translucent rather than unmounting at the ends. */
export const MockArrow = ({
	direction,
	onPress,
	disabled,
	accessibilityLabel,
}: CarouselArrowSlotProps) => (
	<Pressable
		testID={`arrow-${direction}`}
		accessibilityRole="button"
		accessibilityLabel={accessibilityLabel}
		// Marked disabled rather than removed: a button that vanishes under the
		// finger pressing it takes the user's place in the deck with it.
		accessibilityState={{ disabled }}
		onPress={disabled ? undefined : onPress}
		style={[styles.arrow, disabled && styles.arrowDisabled]}
	>
		<Text
			testID={`arrow-${direction}-${disabled ? "disabled" : "enabled"}`}
			style={styles.arrowGlyph}
		>
			{direction === "previous" ? "‹" : "›"}
		</Text>
	</Pressable>
);

/** Pill-style page dot that widens when selected. */
export const MockDot = ({
	index,
	selected,
	onPress,
	accessibilityLabel,
}: CarouselDotSlotProps) => (
	<Pressable
		testID={`dot-${index}`}
		accessibilityRole="button"
		accessibilityLabel={accessibilityLabel}
		accessibilityState={{ selected }}
		onPress={onPress}
		style={styles.dot}
	>
		{/*
      `accessibilityState` is the right API for real screen readers, but
      react-native-web does not map it onto `aria-selected`/`aria-disabled` for
      a plain button — so the inner testID is what gives the browser-based e2e
      suite something stable to assert the visual state on.
    */}
		<View
			testID={`dot-${index}-${selected ? "selected" : "idle"}`}
			style={[styles.dotInner, selected && styles.dotSelected]}
		/>
	</Pressable>
);

/** A "3 / 8" counter — the case a per-page `Dot` cannot express. */
export const MockFraction = ({
	page,
	pageCount,
	accessibilityLabel,
}: CarouselPaginationSlotProps) => (
	<View
		style={styles.fraction}
		accessibilityLabel={accessibilityLabel}
		testID="fraction"
	>
		<Text style={styles.fractionText}>{`${page + 1} / ${pageCount}`}</Text>
	</View>
);

/** Auto-play control. WCAG 2.2.2 requires one whenever `autoPlay` is on. */
export const MockPlayPause = ({
	isPlaying,
	onPress,
	accessibilityLabel,
}: CarouselPlayPauseSlotProps) => (
	<Pressable
		testID="play-pause"
		accessibilityRole="button"
		accessibilityLabel={accessibilityLabel}
		onPress={onPress}
		style={styles.playPause}
	>
		<Text style={styles.playPauseText}>
			{isPlaying ? "❚❚ Pause" : "▶ Play"}
		</Text>
	</Pressable>
);

/** A stand-in slide, so the stories have something to page through. */
export const MockSlide = ({
	index,
	caption,
}: {
	index: number;
	caption?: ReactNode;
}) => (
	<View style={styles.slide} testID={`slide-${index}`}>
		<Text style={styles.slideTitle}>{index + 1}</Text>
		{caption ? <Text style={styles.slideCaption}>{caption}</Text> : null}
	</View>
);

/** `n` mock slides, for the `children` mode. */
export const mockSlides = (
	count: number,
	caption?: (index: number) => string,
) =>
	Array.from({ length: count }, (_, index) => (
		<MockSlide
			// biome-ignore lint/suspicious/noArrayIndexKey: a fixed list of stand-in slides
			key={`slide-${index}`}
			index={index}
			caption={caption?.(index)}
		/>
	));

/** `n` mock records, for the virtualized `data` mode. */
export const mockData = (count: number) =>
	Array.from({ length: count }, (_, index) => ({ id: `item-${index}`, index }));
