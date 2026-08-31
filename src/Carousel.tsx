import {
	Children,
	forwardRef,
	type ReactElement,
	type ReactNode,
	type Ref,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	AccessibilityInfo,
	FlatList,
	I18nManager,
	type ListRenderItemInfo,
	Platform,
	ScrollView,
	StyleSheet,
	View,
	type ViewStyle,
} from "react-native";

import { CarouselProvider } from "./CarouselContext";
import { SlideStoreProvider } from "./CarouselSlideContext";
import { useAutoPlay } from "./hooks/useAutoPlay";
import { useCarouselMetrics } from "./hooks/useCarouselMetrics";
import { useCarouselPage } from "./hooks/useCarouselPage";
import { useCarouselScroll } from "./hooks/useCarouselScroll";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { useSlideStore } from "./hooks/useSlideStore";
import type {
	CarouselComponents,
	CarouselContextValue,
	CarouselHandle,
	CarouselNavigateOptions,
	CarouselPageChangeSource,
	CarouselProgressEvent,
	CarouselProps,
	CarouselSlotLayout,
} from "./types";
import {
	type Geometry,
	goToTarget,
	pageForSlide,
	snapOffsets,
	sourceIndexFor,
	stepTarget,
	withClones,
} from "./utils/geometry";
import { runKeyAction } from "./utils/keyboard";

const defaultPageLabel = (index: number) => `Page ${index + 1}`;
const defaultSlideLabel = (index: number, total: number) =>
	`${index + 1} of ${total}`;
const defaultStatusLabel = (index: number, total: number) =>
	`Page ${index + 1} of ${total}`;

const EMPTY_COMPONENTS: CarouselComponents = {};
const EMPTY_SLOTS: CarouselSlotLayout = {};

const styles = StyleSheet.create({
	root: { width: "100%" },
	// `position: relative` is the default, but naming it here is what makes the
	// absolutely-positioned overlay slots below resolve against the track rather
	// than against whatever ancestor happens to be positioned.
	//
	// The flex pair is what lets a page-level carousel work: given a bounded
	// height — `style={{ flex: 1 }}` inside a screen, or an explicit one — the
	// track takes the room the `above`/`below` slots leave, so the indicator row
	// sits at the bottom of the screen rather than under the slides. When the
	// height is auto, as it is by default, there is no free space to hand out
	// and both are inert.
	trackWrapper: { position: "relative", flexGrow: 1, flexShrink: 1 },
	// Same bargain one level down: the scroller fills the wrapper when there is
	// height to fill, and is sized by its slides when there is not.
	track: { flexGrow: 1, flexShrink: 1 },
	overlay: {
		position: "absolute",
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		justifyContent: "center",
	},
	arrowsOverlay: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	arrowsRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	paginationRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
	},
	playPauseOverlay: { alignItems: "flex-end", justifyContent: "flex-start" },
	playPauseRow: { alignItems: "center" },
});

/**
 * `snapToOffsets` is a native-only prop — react-native-web drops it — so on web
 * the same snapping is expressed as CSS scroll-snap instead. Without this a
 * free drag in a browser coasts to rest between pages.
 */
const IS_WEB = Platform.OS === "web";
const webSnapContainer = (peek: number): ViewStyle | null =>
	IS_WEB
		? ({
				scrollSnapType: "x mandatory",
				// Snap points align to the slide's leading edge, which sits `peek` in
				// from the container's.
				scrollPaddingLeft: peek,
				scrollPaddingRight: peek,
			} as ViewStyle)
		: null;
/** Only page boundaries are snap points — not every slide within a page. */
const webSnapSlide = (isPageStart: boolean): ViewStyle | null =>
	IS_WEB
		? ({ scrollSnapAlign: isPageStart ? "start" : "none" } as ViewStyle)
		: null;

/**
 * A role for a container the carousel names.
 *
 * react-native-web turns `accessibilityLabel` into `aria-label`, and ARIA
 * forbids a name on a role-less `div` — a screen reader drops it, so the
 * carousel, its slides and its dot row would all go unnamed on the web. Native
 * has no such rule, and a role there changes how the platform groups a view, so
 * this stays web-only.
 */
const webGroup: { role?: "group" } = IS_WEB ? { role: "group" } : {};

/** The event react-native-web hands `onKeyDown`, which RN's types do not model. */
interface WebKeyEvent {
	key: string;
	target: unknown;
	currentTarget: unknown;
	preventDefault: () => void;
}

/** Whether a rendered slide position is one of the `infinite` clones. */
const isCloneAt = (
	renderedIndex: number,
	geometry: Geometry,
	slideCount: number,
) =>
	geometry.cloned &&
	(renderedIndex < geometry.leadingClones ||
		renderedIndex >= geometry.leadingClones + slideCount);

function CarouselImpl<TItem>(
	props: CarouselProps<TItem>,
	ref: Ref<CarouselHandle>,
): ReactElement {
	const {
		children,
		data,
		renderItem,
		keyExtractor,
		visibleSlides,
		peek,
		spacing = 0,
		loop = false,
		infinite = false,
		page: controlledPage,
		defaultPage = 0,
		onPageChanged,
		autoPlay = false,
		interval = 3000,
		components = EMPTY_COMPONENTS,
		slots = EMPTY_SLOTS,
		style,
		trackStyle,
		slideStyle,
		paginationStyle,
		arrowsStyle,
		accessibilityLabel = "Carousel",
		paginationLabel = "Carousel pages",
		pageLabel = defaultPageLabel,
		slideLabel = defaultSlideLabel,
		statusLabel = defaultStatusLabel,
		previousLabel = "Previous slide",
		nextLabel = "Next slide",
		pauseLabel = "Pause automatic rotation",
		playLabel = "Resume automatic rotation",
		trackActiveSlides = false,
		onDragStart,
		onDragEnd,
		onSnapStart,
		onSnapEnd,
		onProgress,
		testID,
	} = props;

	const isVirtualized = data !== undefined;
	const childSlides = useMemo(
		() => (isVirtualized ? [] : Children.toArray(children)),
		[isVirtualized, children],
	);
	const slideCount = isVirtualized ? data.length : childSlides.length;

	const rtl = I18nManager.isRTL;
	const reducedMotion = useReducedMotion();
	// `infinite` is a stronger `loop`: both wrap, only `infinite` clones.
	const wraps = loop || infinite;

	const { geometry, onLayout } = useCarouselMetrics({
		slideCount,
		visibleSlides,
		peek,
		spacing,
		infinite,
	});
	const {
		pageCount,
		visibleSlides: visible,
		slideWidth,
		peek: resolvedPeek,
	} = geometry;

	const { page, pageRef, commitPage } = useCarouselPage({
		page: controlledPage,
		defaultPage,
		pageCount,
		onPageChanged,
	});

	const slideStore = useSlideStore();
	const hasPeek = resolvedPeek > 0;

	// Keeps `useCarouselSlide` in sync with a page or layout change that did not
	// come with a scroll event of its own — an external `page` jump, or a
	// responsive `visibleSlides` breakpoint change.
	useEffect(() => {
		slideStore.update({
			page,
			visibleSlides: visible,
			absoluteProgress: page,
			hasPeek,
		});
	}, [slideStore, page, visible, hasPeek]);

	const handleProgress = useCallback(
		(event: CarouselProgressEvent) => {
			slideStore.update({
				page: event.page,
				visibleSlides: visible,
				absoluteProgress: event.absoluteProgress,
				hasPeek,
			});
			onProgress?.(event);
		},
		[slideStore, visible, hasPeek, onProgress],
	);

	const bridge = useCarouselScroll({
		geometry,
		page,
		pageRef,
		commitPage,
		rtl,
		reducedMotion,
		onProgress: handleProgress,
		onSnapStart,
		onSnapEnd,
	});
	const { applyTarget, attachScroller } = bridge;

	const [isDragging, setIsDragging] = useState(false);

	// ── Navigation ──────────────────────────────────────────────────────────────

	const navigate = useCallback(
		(
			delta: number,
			options: CarouselNavigateOptions | undefined,
			allowWrap: boolean,
			source: CarouselPageChangeSource,
		) => {
			const target = stepTarget(pageRef.current, delta, geometry, allowWrap);
			if (target) {
				applyTarget(target, options?.animated ?? true, source);
			}
		},
		[geometry, applyTarget, pageRef],
	);

	const next = useCallback(
		(options?: CarouselNavigateOptions) => navigate(1, options, wraps, "next"),
		[navigate, wraps],
	);
	const previous = useCallback(
		(options?: CarouselNavigateOptions) =>
			navigate(-1, options, wraps, "previous"),
		[navigate, wraps],
	);
	const goTo = useCallback(
		(
			target: number,
			options?: CarouselNavigateOptions,
			source: CarouselPageChangeSource = "pagination",
		) => {
			applyTarget(
				goToTarget(target, geometry),
				options?.animated ?? true,
				source,
			);
		},
		[applyTarget, geometry],
	);
	const goToSlide = useCallback(
		(
			slide: number,
			options?: CarouselNavigateOptions,
			source: CarouselPageChangeSource = "pagination",
		) => {
			goTo(pageForSlide(slide, geometry, slideCount), options, source);
		},
		[goTo, geometry, slideCount],
	);

	// The `ref` handle is a distinct call site from the chrome/context actions
	// above, so it is the one place that can honestly say a move came from
	// outside the carousel's own rendering — "imperative" as in `useImperativeHandle`.
	const imperativeNext = useCallback(
		(options?: CarouselNavigateOptions) =>
			navigate(1, options, wraps, "imperative"),
		[navigate, wraps],
	);
	const imperativePrevious = useCallback(
		(options?: CarouselNavigateOptions) =>
			navigate(-1, options, wraps, "imperative"),
		[navigate, wraps],
	);
	const imperativeGoTo = useCallback(
		(target: number, options?: CarouselNavigateOptions) =>
			goTo(target, options, "imperative"),
		[goTo],
	);
	const imperativeGoToSlide = useCallback(
		(slide: number, options?: CarouselNavigateOptions) =>
			goToSlide(slide, options, "imperative"),
		[goToSlide],
	);

	// Rotation always wraps, even without `loop`: a deck that silently stops on
	// the last slide reads as broken rather than finished.
	const handleTick = useCallback(
		() => navigate(1, undefined, true, "autoplay"),
		[navigate],
	);
	const { isPlaying, play, pause } = useAutoPlay({
		enabled: autoPlay,
		interval,
		isDragging,
		onTick: handleTick,
	});

	// ── Imperative handle ───────────────────────────────────────────────────────

	const pageCountRef = useRef(pageCount);
	const isPlayingRef = useRef(isPlaying);
	useEffect(() => {
		pageCountRef.current = pageCount;
		isPlayingRef.current = isPlaying;
	});

	useImperativeHandle(
		ref,
		() => ({
			next: imperativeNext,
			previous: imperativePrevious,
			goTo: imperativeGoTo,
			goToSlide: imperativeGoToSlide,
			play,
			pause,
			// Getters rather than a frozen snapshot, so a read taken on the line
			// after `next()` is already right instead of a render behind.
			get page() {
				return pageRef.current;
			},
			get pageCount() {
				return pageCountRef.current;
			},
			get isPlaying() {
				return isPlayingRef.current;
			},
		}),
		[
			imperativeNext,
			imperativePrevious,
			imperativeGoTo,
			imperativeGoToSlide,
			play,
			pause,
			pageRef,
		],
	);

	// ── Screen-reader announcements ─────────────────────────────────────────────

	const announcedRef = useRef(true);
	useEffect(() => {
		// Skip the mount announcement: nothing changed yet, and a carousel that
		// talks the moment it appears talks over the rest of the screen.
		if (announcedRef.current) {
			announcedRef.current = false;
			return;
		}
		// Silent while a rotation is actually running — a carousel that speaks
		// every few seconds makes the screen unusable.
		if (!statusLabel || pageCount <= 1 || isPlaying) {
			return;
		}
		AccessibilityInfo.announceForAccessibility(statusLabel(page, pageCount));
	}, [page, pageCount, statusLabel, isPlaying]);

	// ── Drag tracking ───────────────────────────────────────────────────────────

	const handleScrollBeginDrag = useCallback(() => {
		bridge.onScrollBeginDrag();
		setIsDragging(true);
		onDragStart?.();
	}, [bridge, onDragStart]);

	const handleScrollEndDrag = useCallback(
		(event: Parameters<typeof bridge.onScrollEndDrag>[0]) => {
			bridge.onScrollEndDrag(event);
			setIsDragging(false);
			onDragEnd?.();
		},
		[bridge, onDragEnd],
	);

	// ── Context ─────────────────────────────────────────────────────────────────

	const canGoPrevious = wraps ? pageCount > 1 : page > 0;
	const canGoNext = wraps ? pageCount > 1 : page < pageCount - 1;

	const contextValue = useMemo<CarouselContextValue>(
		() => ({
			page,
			pageCount,
			slideCount,
			visibleSlides: visible,
			slideWidth,
			canGoPrevious,
			canGoNext,
			isPlaying,
			isDragging,
			next,
			previous,
			goTo,
			goToSlide,
			play,
			pause,
		}),
		[
			page,
			pageCount,
			slideCount,
			visible,
			slideWidth,
			canGoPrevious,
			canGoNext,
			isPlaying,
			isDragging,
			next,
			previous,
			goTo,
			goToSlide,
			play,
			pause,
		],
	);

	// ── Track ───────────────────────────────────────────────────────────────────

	// `rtl` is a real dependency even though `I18nManager.isRTL` cannot change
	// without an app reload, which is why the analyser reads it as stable.
	// biome-ignore lint/correctness/useExhaustiveDependencies: rtl is a genuine input
	const offsets = useMemo(() => snapOffsets(geometry, rtl), [geometry, rtl]);
	const contentContainerStyle = useMemo(
		() => ({ paddingHorizontal: resolvedPeek }),
		[resolvedPeek],
	);

	const slideWrapperStyle = useCallback(
		(renderedIndex: number) => [
			{
				width: slideWidth,
				marginEnd:
					renderedIndex < geometry.renderedSlideCount - 1 ? spacing : 0,
			},
			webSnapSlide(renderedIndex % visible === 0),
			slideStyle,
		],
		[slideWidth, spacing, geometry.renderedSlideCount, visible, slideStyle],
	);

	const activeRange = useMemo(
		() =>
			trackActiveSlides
				? { from: page * visible, to: (page + 1) * visible }
				: null,
		[trackActiveSlides, page, visible],
	);

	/**
	 * Keyboard paging, for the one platform whose scroll container takes focus.
	 *
	 * A horizontal scroller that only a pointer can move is unreachable for a
	 * keyboard user, and the browser's own arrow-key scrolling nudges the track a
	 * few pixels into a snap point rather than paging — so the handled keys are
	 * taken over, and every other key is left alone.
	 */
	const handleKeyDown = useCallback(
		// React Native types `onKeyDown` for its own TV key events, which carry no
		// `key` at all, so the web event is narrowed here rather than at the prop.
		(keyEvent: unknown) => {
			const event = keyEvent as WebKeyEvent;

			// A control inside a slide keeps its own keys: only presses that land on
			// the track itself are the carousel's to interpret.
			if (event.target !== event.currentTarget) {
				return;
			}

			const actions = { next, previous, goTo };
			if (runKeyAction(event.key, I18nManager.isRTL, pageCount, actions)) {
				event.preventDefault();
			}
		},
		[next, previous, goTo, pageCount],
	);

	const scrollerProps = {
		horizontal: true as const,
		showsHorizontalScrollIndicator: false,
		// Snap points rather than `pagingEnabled`: paging snaps to whole viewport
		// widths, which breaks `visibleSlides`, `peek` and `spacing` at once.
		snapToOffsets: offsets.length > 0 ? offsets : undefined,
		snapToAlignment: "start" as const,
		decelerationRate: "fast" as const,
		disableIntervalMomentum: true,
		scrollEventThrottle: 16,
		contentContainerStyle,
		style: [styles.track, webSnapContainer(resolvedPeek), trackStyle],
		testID: testID === undefined ? undefined : `${testID}-track`,
		onScroll: bridge.onScroll,
		onMomentumScrollBegin: bridge.onMomentumScrollBegin,
		onMomentumScrollEnd: bridge.onMomentumScrollEnd,
		onScrollBeginDrag: handleScrollBeginDrag,
		onScrollEndDrag: handleScrollEndDrag,
		onContentSizeChange: bridge.onContentSizeChange,
		// `focusable` is what puts the track in the tab order — without it the
		// scroll region is reachable by pointer only, which is the accessibility
		// failure `onKeyDown` below exists to answer.
		...(IS_WEB ? { focusable: true, onKeyDown: handleKeyDown } : {}),
	};

	const renderedData = useMemo(
		() => (isVirtualized ? withClones(data, geometry) : []),
		[isVirtualized, data, geometry],
	);

	const renderVirtualizedItem = useCallback(
		({ item, index }: ListRenderItemInfo<TItem>) => {
			const source = sourceIndexFor(index, geometry, slideCount);
			const clone = isCloneAt(index, geometry, slideCount);
			return (
				<View
					{...webGroup}
					style={slideWrapperStyle(index)}
					accessibilityLabel={
						clone ? undefined : slideLabel(source, slideCount)
					}
					// Clones are duplicates of real slides, so exposing them would make a
					// screen reader read the same content twice and count the deck wrong.
					accessibilityElementsHidden={clone}
					importantForAccessibility={clone ? "no-hide-descendants" : "auto"}
				>
					{renderItem?.({
						item,
						index: source,
						slideWidth,
						isActive: activeRange
							? source >= activeRange.from && source < activeRange.to
							: false,
					})}
				</View>
			);
		},
		[
			geometry,
			slideCount,
			slideWrapperStyle,
			slideLabel,
			renderItem,
			slideWidth,
			activeRange,
		],
	);

	const virtualizedKeyExtractor = useCallback(
		(item: TItem, index: number) => {
			const source = sourceIndexFor(index, geometry, slideCount);
			const base = keyExtractor ? keyExtractor(item, source) : String(source);
			// Clones repeat real items, so the rendered position has to make the key
			// unique or React sees duplicates.
			return geometry.cloned ? `${base}::${index}` : base;
		},
		[keyExtractor, geometry, slideCount],
	);

	const getItemLayout = useCallback(
		(_: ArrayLike<TItem> | null | undefined, index: number) => ({
			length: geometry.slideStride,
			offset: resolvedPeek + index * geometry.slideStride,
			index,
		}),
		[geometry.slideStride, resolvedPeek],
	);

	const track = isVirtualized ? (
		<FlatList
			ref={attachScroller}
			data={renderedData as TItem[]}
			renderItem={renderVirtualizedItem}
			keyExtractor={virtualizedKeyExtractor}
			// The offsets are already known, so the list never needs a measuring pass.
			getItemLayout={getItemLayout}
			initialNumToRender={Math.max(1, visible * 2)}
			windowSize={3}
			removeClippedSubviews
			{...scrollerProps}
		/>
	) : (
		<ScrollView ref={attachScroller} {...scrollerProps}>
			{withClones(childSlides, geometry).map(
				(node: ReactNode, index: number) => {
					const source = sourceIndexFor(index, geometry, slideCount);
					const clone = isCloneAt(index, geometry, slideCount);
					return (
						<View
							{...webGroup}
							// Position is stable across renders, so an index key is the right
							// one here — the clones make child keys ambiguous anyway.
							// biome-ignore lint/suspicious/noArrayIndexKey: rendered order is fixed
							key={`slide-${index}`}
							style={slideWrapperStyle(index)}
							accessibilityLabel={
								clone ? undefined : slideLabel(source, slideCount)
							}
							accessibilityElementsHidden={clone}
							importantForAccessibility={clone ? "no-hide-descendants" : "auto"}
						>
							{node}
						</View>
					);
				},
			)}
		</ScrollView>
	);

	// ── Chrome slots ────────────────────────────────────────────────────────────

	const PreviousArrow = components.PreviousArrow ?? components.Arrow;
	const NextArrow = components.NextArrow ?? components.Arrow;
	const { Dot, Pagination, PlayPauseControl } = components;

	const arrowsPosition = slots.arrows ?? "overlay";
	const paginationPosition = slots.pagination ?? "below";
	const playPausePosition = slots.playPause ?? "overlay";

	// A single-page deck has nothing to navigate, so the arrows would only be
	// permanently dead controls.
	const showArrows = (PreviousArrow || NextArrow) && pageCount > 1;
	const arrowsNode = showArrows ? (
		<View
			pointerEvents="box-none"
			style={[
				arrowsPosition === "overlay"
					? [styles.overlay, styles.arrowsOverlay]
					: styles.arrowsRow,
				arrowsStyle,
			]}
		>
			<View pointerEvents="box-none">
				{PreviousArrow ? (
					<PreviousArrow
						direction="previous"
						onPress={previous}
						disabled={!canGoPrevious}
						accessibilityLabel={previousLabel}
						page={page}
						pageCount={pageCount}
					/>
				) : null}
			</View>
			<View pointerEvents="box-none">
				{NextArrow ? (
					<NextArrow
						direction="next"
						onPress={next}
						disabled={!canGoNext}
						accessibilityLabel={nextLabel}
						page={page}
						pageCount={pageCount}
					/>
				) : null}
			</View>
		</View>
	) : null;

	let paginationNode: ReactNode = null;
	if (Pagination) {
		paginationNode = (
			<Pagination
				page={page}
				pageCount={pageCount}
				goTo={goTo}
				pageLabel={pageLabel}
				accessibilityLabel={paginationLabel}
			/>
		);
	} else if (Dot) {
		paginationNode = (
			<View
				{...webGroup}
				accessibilityLabel={paginationLabel}
				style={[
					paginationPosition === "overlay" ? styles.overlay : null,
					styles.paginationRow,
					paginationStyle,
				]}
				pointerEvents="box-none"
			>
				{Array.from({ length: pageCount }, (_, index) => (
					<Dot
						// The page index *is* the identity here: this is a fixed-length
						// row of interchangeable controls, one per page.
						// biome-ignore lint/suspicious/noArrayIndexKey: index is the identity
						key={`dot-${index}`}
						index={index}
						total={pageCount}
						selected={index === page}
						onPress={() => goTo(index)}
						accessibilityLabel={pageLabel(index, pageCount)}
					/>
				))}
			</View>
		);
	}

	const playPauseNode =
		autoPlay && PlayPauseControl ? (
			<View
				pointerEvents="box-none"
				style={
					playPausePosition === "overlay"
						? [styles.overlay, styles.playPauseOverlay]
						: styles.playPauseRow
				}
			>
				<PlayPauseControl
					isPlaying={isPlaying}
					onPress={isPlaying ? pause : play}
					accessibilityLabel={isPlaying ? pauseLabel : playLabel}
				/>
			</View>
		) : null;

	/** Render `node` only when its slot was configured for `position`. */
	const at = (position: string) => (node: ReactNode, slotPosition: string) =>
		slotPosition === position ? node : null;

	return (
		<CarouselProvider value={contextValue}>
			<View
				{...webGroup}
				style={[styles.root, style]}
				onLayout={onLayout}
				accessibilityLabel={accessibilityLabel}
				testID={testID}
			>
				{at("above")(arrowsNode, arrowsPosition)}
				{at("above")(paginationNode, paginationPosition)}
				{at("above")(playPauseNode, playPausePosition)}

				<View style={styles.trackWrapper}>
					<SlideStoreProvider value={slideStore}>{track}</SlideStoreProvider>
					{at("overlay")(arrowsNode, arrowsPosition)}
					{at("overlay")(paginationNode, paginationPosition)}
					{at("overlay")(playPauseNode, playPausePosition)}
				</View>

				{at("below")(arrowsNode, arrowsPosition)}
				{at("below")(paginationNode, paginationPosition)}
				{at("below")(playPauseNode, playPausePosition)}
			</View>
		</CarouselProvider>
	);
}

/**
 * A headless, dependency-free horizontal carousel.
 *
 * The component owns every behaviour — measuring, paging, snapping, wrapping,
 * auto-play, accessibility — and draws nothing but the scrollable track. All
 * visible chrome comes from the `components` slots you supply, or from
 * `useCarousel` for anything the slots do not cover.
 *
 * Slides arrive either as `children` (every slide mounted, ideal for a handful
 * of screens) or as `data` + `renderItem` (virtualized, for long lists).
 *
 * @example Static slides with mocked chrome
 * ```tsx
 * <Carousel
 *   visibleSlides={{ base: 3, 700: 2, 400: 1 }}
 *   spacing={12}
 *   peek={24}
 *   loop
 *   components={{ Arrow: MyArrow, Dot: MyDot }}
 * >
 *   {items.map((item) => <Card key={item.id} {...item} />)}
 * </Carousel>
 * ```
 *
 * @example Virtualized, controlled
 * ```tsx
 * const [page, setPage] = useState(0);
 *
 * <Carousel
 *   data={photos}
 *   renderItem={({ item }) => <Photo uri={item.uri} />}
 *   keyExtractor={(item) => item.id}
 *   page={page}
 *   onPageChanged={setPage}
 * />
 * ```
 */
export const Carousel = forwardRef(CarouselImpl) as <TItem = unknown>(
	props: CarouselProps<TItem> & { ref?: Ref<CarouselHandle> },
) => ReactElement;
