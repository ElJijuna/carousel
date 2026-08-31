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
	cardInk: "#f8fafc",
	cardChip: "#e2c275",
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

	card: {
		height: 190,
		borderRadius: 16,
		padding: 20,
		justifyContent: "space-between",
		shadowColor: palette.shadow,
		shadowOpacity: 0.2,
		shadowRadius: 10,
		shadowOffset: { width: 0, height: 4 },
		elevation: 4,
	},
	cardRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	cardIssuer: { fontSize: 13, fontWeight: "600", color: palette.cardInk },
	cardTier: {
		fontSize: 11,
		letterSpacing: 2,
		color: palette.cardInk,
		opacity: 0.8,
	},
	cardChip: {
		width: 40,
		height: 30,
		borderRadius: 6,
		backgroundColor: palette.cardChip,
	},
	cardNumber: {
		fontSize: 18,
		letterSpacing: 2,
		color: palette.cardInk,
		fontVariant: ["tabular-nums"],
	},
	cardLabel: {
		fontSize: 9,
		letterSpacing: 1,
		color: palette.cardInk,
		opacity: 0.7,
		marginBottom: 2,
	},
	cardValue: {
		fontSize: 13,
		fontWeight: "600",
		color: palette.cardInk,
		fontVariant: ["tabular-nums"],
	},
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

/** One card in the wallet story. */
export interface MockCard {
	id: string;
	/** Name printed top-left. Invented, like every value here. */
	issuer: string;
	/** Product tier, printed top-right. */
	tier: string;
	/** Last four digits — the only ones a real card UI may show. */
	last4: string;
	holder: string;
	/** MM/YY. */
	expires: string;
	background: string;
}

/**
 * A credit card slide.
 *
 * Every number below is fake and stays fake: a card carousel is the one place
 * where the slide, not the carousel, decides what may be rendered, so only the
 * last four digits are ever printed and the accessible name says the same.
 */
export const MockCreditCard = ({ card }: { card: MockCard }) => (
	<View
		testID={`card-${card.id}`}
		accessible
		accessibilityLabel={`${card.tier} card ending in ${card.last4}, expires ${card.expires}`}
		style={[styles.card, { backgroundColor: card.background }]}
	>
		<View style={styles.cardRow}>
			<Text style={styles.cardIssuer}>{card.issuer}</Text>
			<Text style={styles.cardTier}>{card.tier.toUpperCase()}</Text>
		</View>
		<View style={styles.cardChip} />
		<Text style={styles.cardNumber}>{`•••• •••• •••• ${card.last4}`}</Text>
		<View style={styles.cardRow}>
			<View>
				<Text style={styles.cardLabel}>CARDHOLDER</Text>
				<Text style={styles.cardValue}>{card.holder}</Text>
			</View>
			<View>
				<Text style={styles.cardLabel}>EXPIRES</Text>
				<Text style={styles.cardValue}>{card.expires}</Text>
			</View>
		</View>
	</View>
);

/** A wallet's worth of fake cards, for the credit-card story. */
export const mockCards: readonly MockCard[] = [
	{
		id: "platinum",
		issuer: "Real Native Bank",
		tier: "Platinum",
		last4: "4242",
		holder: "A. MARTINEZ",
		expires: "08/29",
		background: "#1f2937",
	},
	{
		id: "gold",
		issuer: "Real Native Bank",
		tier: "Gold",
		last4: "8210",
		holder: "A. MARTINEZ",
		expires: "11/27",
		background: "#b45309",
	},
	{
		id: "classic",
		issuer: "Real Native Bank",
		tier: "Classic",
		last4: "0417",
		holder: "A. MARTINEZ",
		expires: "03/28",
		background: "#1d4ed8",
	},
	{
		id: "travel",
		issuer: "Real Native Bank",
		tier: "Travel",
		last4: "9931",
		holder: "A. MARTINEZ",
		expires: "06/30",
		background: "#047857",
	},
];
