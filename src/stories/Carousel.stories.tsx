import type { Meta, StoryObj } from "@storybook/react";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Carousel } from "../Carousel";
import { useCarousel } from "../CarouselContext";
import type { CarouselHandle } from "../types";
import {
	MockArrow,
	MockCreditCard,
	MockDot,
	MockFraction,
	MockPlayPause,
	MockSlide,
	mockCards,
	mockData,
	mockSlides,
	palette,
} from "./mocks";

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		gap: 8,
		marginTop: 12,
		justifyContent: "center",
	},
	button: {
		paddingVertical: 8,
		paddingHorizontal: 14,
		borderRadius: 8,
		backgroundColor: palette.ink,
	},
	buttonText: { color: palette.surface, fontSize: 13 },
	readout: {
		marginTop: 8,
		textAlign: "center",
		color: palette.caption,
		fontSize: 13,
	},
	progressTrack: {
		height: 4,
		borderRadius: 2,
		backgroundColor: palette.track,
		marginTop: 12,
	},
	progressFill: { height: 4, borderRadius: 2, backgroundColor: palette.accent },
	dimmed: { opacity: 0.4 },
});

const meta = {
	title: "Carousel",
	component: Carousel,
	parameters: {
		docs: {
			description: {
				component:
					"A headless horizontal carousel. It owns every behaviour and draws nothing but the " +
					"track — every arrow, dot and control below comes from the `components` slots, " +
					"mocked in `src/stories/mocks.tsx`.",
			},
		},
	},
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One slide per page, dots below — the smallest useful configuration. */
export const Basic: Story = {
	args: {
		testID: "carousel",
		components: { Dot: MockDot },
		children: mockSlides(4),
	},
};

/** Nothing passed in `components`, so nothing but the track is drawn. */
export const NoChrome: Story = {
	args: {
		testID: "carousel",
		children: mockSlides(4),
	},
};

/** Arrows overlaid on the track edges, disabled at the ends. */
export const WithArrows: Story = {
	args: {
		testID: "carousel",
		components: { Arrow: MockArrow, Dot: MockDot },
		children: mockSlides(4),
	},
};

/** Three slides at a time; paging moves a whole group, so 6 slides give 2 pages. */
export const VisibleSlides: Story = {
	args: {
		testID: "carousel",
		visibleSlides: 3,
		spacing: 12,
		components: { Arrow: MockArrow, Dot: MockDot },
		children: mockSlides(6),
	},
};

/** `peek` shows a sliver of the neighbours, so the deck reads as continuous. */
export const PeekAndSpacing: Story = {
	args: {
		testID: "carousel",
		visibleSlides: 2,
		spacing: 12,
		peek: 32,
		components: { Arrow: MockArrow, Dot: MockDot },
		children: mockSlides(7),
	},
};

/** A breakpoint map resolved against the carousel's own width — resize me. */
export const Responsive: Story = {
	args: {
		testID: "carousel",
		visibleSlides: { base: 3, 700: 2, 460: 1 },
		peek: { base: 32, 460: 16 },
		spacing: 12,
		components: { Arrow: MockArrow, Dot: MockDot },
		children: mockSlides(9),
	},
};

/** `loop` rewinds past the ends. Nothing is cloned. */
export const Loop: Story = {
	args: {
		testID: "carousel",
		loop: true,
		components: { Arrow: MockArrow, Dot: MockDot },
		children: mockSlides(4),
	},
};

/** `infinite` keeps moving in the same direction by cloning a page at each end. */
export const Infinite: Story = {
	args: {
		testID: "carousel",
		infinite: true,
		visibleSlides: 2,
		spacing: 12,
		peek: 24,
		components: { Arrow: MockArrow, Dot: MockDot },
		children: mockSlides(6),
	},
};

/** Rotates on a timer, with the stop control WCAG 2.2.2 requires. */
export const AutoPlay: Story = {
	args: {
		testID: "carousel",
		autoPlay: true,
		interval: 2000,
		loop: true,
		components: { Dot: MockDot, PlayPauseControl: MockPlayPause },
		children: mockSlides(4),
	},
};

/** A `Pagination` slot replaces the whole dot row with a counter. */
export const FractionPagination: Story = {
	args: {
		testID: "carousel",
		components: { Arrow: MockArrow, Pagination: MockFraction },
		children: mockSlides(8),
	},
};

/**
 * Virtualized: 500 slides, but only the few near the viewport are mounted.
 *
 * Rendered through `render` rather than `args` so `Carousel`'s item generic is
 * inferred from the real `data` instead of being pinned to `unknown` by `Meta`.
 */
const virtualizedData = mockData(500);

export const Virtualized: Story = {
	args: { testID: "carousel" },
	render: () => (
		<Carousel
			testID="carousel"
			visibleSlides={2}
			spacing={12}
			data={virtualizedData}
			keyExtractor={(item) => item.id}
			renderItem={({ item }) => (
				<MockSlide index={item.index} caption="virtualized" />
			)}
			components={{ Arrow: MockArrow, Pagination: MockFraction }}
		/>
	),
};

/** The parent owns the page and feeds `onPageChanged` straight back. */
export const Controlled: Story = {
	args: { testID: "carousel" },
	render: () => {
		const [page, setPage] = useState(0);
		return (
			<View>
				<Carousel
					testID="carousel"
					page={page}
					onPageChanged={setPage}
					components={{ Arrow: MockArrow, Dot: MockDot }}
				>
					{mockSlides(5)}
				</Carousel>
				<View style={styles.row}>
					<Pressable
						testID="external-first"
						style={styles.button}
						onPress={() => setPage(0)}
					>
						<Text style={styles.buttonText}>First</Text>
					</Pressable>
					<Pressable
						testID="external-last"
						style={styles.button}
						onPress={() => setPage(4)}
					>
						<Text style={styles.buttonText}>Last</Text>
					</Pressable>
				</View>
				<Text
					testID="page-readout"
					style={styles.readout}
				>{`page ${page}`}</Text>
			</View>
		);
	},
};

/** Driving the carousel through its `ref`, from a toolbar outside it. */
export const ImperativeHandle: Story = {
	args: { testID: "carousel" },
	render: () => {
		const carousel = useRef<CarouselHandle>(null);
		const [readout, setReadout] = useState("page 0");
		const sync = () => setReadout(`page ${carousel.current?.page ?? 0}`);
		return (
			<View>
				<Carousel
					testID="carousel"
					ref={carousel}
					loop
					components={{ Dot: MockDot }}
				>
					{mockSlides(6)}
				</Carousel>
				<View style={styles.row}>
					<Pressable
						testID="handle-previous"
						style={styles.button}
						onPress={() => {
							carousel.current?.previous();
							sync();
						}}
					>
						<Text style={styles.buttonText}>Previous</Text>
					</Pressable>
					<Pressable
						testID="handle-slide"
						style={styles.button}
						onPress={() => {
							carousel.current?.goToSlide(4);
							sync();
						}}
					>
						<Text style={styles.buttonText}>Slide 5</Text>
					</Pressable>
					<Pressable
						testID="handle-next"
						style={styles.button}
						onPress={() => {
							carousel.current?.next();
							sync();
						}}
					>
						<Text style={styles.buttonText}>Next</Text>
					</Pressable>
				</View>
				<Text testID="handle-readout" style={styles.readout}>
					{readout}
				</Text>
			</View>
		);
	},
};

/** Custom chrome built from `useCarousel`, for what the slots do not cover. */
const ProgressBar = () => {
	const { page, pageCount, next, previous, canGoPrevious, canGoNext } =
		useCarousel();
	return (
		<View>
			<View testID="progress-track" style={styles.progressTrack}>
				<View
					testID="progress-fill"
					style={[
						styles.progressFill,
						{ width: `${((page + 1) / pageCount) * 100}%` },
					]}
				/>
			</View>
			<View style={styles.row}>
				<Pressable
					testID="hook-previous"
					style={[styles.button, !canGoPrevious && styles.dimmed]}
					onPress={() => previous()}
				>
					<Text style={styles.buttonText}>Back</Text>
				</Pressable>
				<Pressable
					testID="hook-next"
					style={[styles.button, !canGoNext && styles.dimmed]}
					onPress={() => next()}
				>
					<Text style={styles.buttonText}>Forward</Text>
				</Pressable>
			</View>
		</View>
	);
};

export const CustomChromeViaHook: Story = {
	args: {
		testID: "carousel",
		components: { Pagination: ProgressBar },
		slots: { pagination: "below" },
		children: mockSlides(5),
	},
};

/**
 * A wallet: one card per page, with a sliver of the neighbours showing so the
 * deck reads as a stack you can flick through.
 *
 * `loop` rather than `infinite` — a wallet is a fixed, countable set of cards,
 * and cloning one would show the same card twice.
 *
 * Rendered through `render` rather than `args` so `Carousel`'s item generic is
 * inferred from `mockCards` instead of being pinned to `unknown` by `Meta`.
 */
export const CreditCards: Story = {
	args: { testID: "carousel" },
	render: () => (
		<Carousel
			testID="carousel"
			loop
			spacing={16}
			peek={{ base: 36, 460: 20 }}
			data={mockCards}
			keyExtractor={(card) => card.id}
			renderItem={({ item }) => <MockCreditCard card={item} />}
			slideLabel={(index, total) => `Card ${index + 1} of ${total}`}
			components={{ Arrow: MockArrow, Dot: MockDot }}
		/>
	),
};
