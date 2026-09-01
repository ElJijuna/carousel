# @real-native/carousel

[![npm version](https://img.shields.io/npm/v/@real-native/carousel?logo=npm&logoColor=white&color=cb3837)](https://www.npmjs.com/package/@real-native/carousel)
[![npm downloads](https://img.shields.io/npm/dm/@real-native/carousel?logo=npm&logoColor=white&color=cb3837)](https://www.npmjs.com/package/@real-native/carousel)
[![minzipped size](https://img.shields.io/badge/minzipped-4.9_kB-44cc11)](#bundle-size)
[![dependencies](https://img.shields.io/badge/dependencies-0-44cc11)](https://github.com/ElJijuna/carousel/blob/main/package.json)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/ElJijuna/carousel/blob/main/LICENSE)

[![CI](https://github.com/ElJijuna/carousel/actions/workflows/ci.yml/badge.svg)](https://github.com/ElJijuna/carousel/actions/workflows/ci.yml)
[![Release](https://github.com/ElJijuna/carousel/actions/workflows/release.yml/badge.svg)](https://github.com/ElJijuna/carousel/actions/workflows/release.yml)
[![coverage](https://img.shields.io/badge/coverage-%E2%89%A590%25-44cc11)](https://github.com/ElJijuna/carousel/blob/main/jest.config.mjs)
[![semantic-release](https://img.shields.io/badge/semantic--release-conventional-e10079?logo=semantic-release&logoColor=white)](https://github.com/semantic-release/semantic-release)

[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![React Native](https://img.shields.io/badge/React_Native-%E2%89%A50.74-61DAFB?logo=react&logoColor=white)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-Go_ready-000020?logo=expo&logoColor=white)](https://expo.dev)
[![react-native-web](https://img.shields.io/badge/react--native--web-supported-61DAFB?logo=react&logoColor=white)](https://necolas.github.io/react-native-web/)
[![New Architecture](https://img.shields.io/badge/New_Architecture-Fabric-61DAFB?logo=react&logoColor=white)](https://reactnative.dev/architecture/landing-page)
[![Storybook](https://img.shields.io/badge/Storybook-live_demo-FF4785?logo=storybook&logoColor=white)](https://eljijuna.github.io/carousel/)
[![Playwright](https://img.shields.io/badge/Playwright-e2e-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev)
[![Biome](https://img.shields.io/badge/Biome-formatted-60a5fa?logo=biome&logoColor=white)](https://biomejs.dev)

A **headless**, dependency-free horizontal carousel for React Native, Expo and react-native-web.

**[▶ Live Storybook](https://eljijuna.github.io/carousel/)** — every story running on
react-native-web, with the mocked chrome you can copy from `src/stories/mocks.tsx`.

The component owns every behaviour — measuring, paging, snapping, wrapping, auto-play,
accessibility — and draws **nothing but the scrollable track**. Every arrow, dot and control comes
from you, so the carousel never fights your design system.

```text
dependencies: {}          ← no runtime dependencies at all
peerDependencies: react, react-native
```

- **Zero native modules.** Built on `ScrollView`/`FlatList` from React Native core. Works in Expo
  Go, in bare React Native and on the web with no config, no `pod install`, no prebuild.
- **Headless.** No colours, no icons, no opinions. You supply the chrome through component slots
  or the `useCarousel` hook.
- **Two slide APIs.** `children` for a handful of static slides, `data` + `renderItem` for a
  virtualized list of hundreds.
- **Accessible by default.** Labelled slides, page announcements, controls that go disabled
  instead of vanishing, auto-play that stops for a finger and for the background.
- **Tiny.** ~12 kB minified, **~4.9 kB gzipped** — see [Bundle size](#bundle-size).

---

## Contents

- [Bundle size](#bundle-size)
- [Install](#install)
- [Quick start](#quick-start)
- [Slides: `children` vs `data`](#slides-children-vs-data)
- [Layout: `visibleSlides`, `peek`, `spacing`](#layout-visibleslides-peek-spacing)
- [Responsive props](#responsive-props)
- [The chrome slots](#the-chrome-slots)
- [`useCarousel`](#usecarousel)
- [Slide-level state: `useCarouselSlide`](#slide-level-state-usecarouselslide)
- [Page state](#page-state)
- [Page change events](#page-change-events)
- [Interaction and progress events](#interaction-and-progress-events)
- [Imperative control](#imperative-control)
- [`loop` vs `infinite`](#loop-vs-infinite)
- [Auto-play](#auto-play)
- [Accessibility](#accessibility)
- [Right to left](#right-to-left)
- [Performance](#performance)
- [Platform support](#platform-support)
- [API reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## Bundle size

Only the first two rows reach your app bundle:

| | Size |
| --- | --- |
| Minified | **~12.2 kB** |
| Minified + gzip | **~4.9 kB** |
| Minified + brotli | ~4.4 kB |
| npm tarball (download) | ~72 kB |
| Installed in `node_modules` | ~369 kB |

Because the package has **zero runtime dependencies**, that is the whole cost — nothing transitive
is pulled in behind it. The tarball and `node_modules` figures are larger only because they also
carry the TypeScript source, the `.d.ts` files and the source maps, none of which are bundled into
your app.

Reproduce the measurement yourself:

```bash
npm run build
npx esbuild lib/module/index.js --bundle --format=esm --minify \
  --external:react --external:react-native --outfile=/tmp/carousel.js
gzip -9 -c /tmp/carousel.js | wc -c
```

---

## Install

```bash
npm install @real-native/carousel
# or
yarn add @real-native/carousel
# or, in an Expo project
npx expo install @real-native/carousel
```

There is nothing else to do. No native dependencies, no linking, no config plugin.

---

## Quick start

The carousel renders no UI of its own, so start by giving it something to render:

```tsx
import { Carousel } from '@real-native/carousel';
import { Pressable, Text, View } from 'react-native';

const Dot = ({ selected, onPress, accessibilityLabel }) => (
  <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
    <View
      style={{
        width: 8,
        height: 8,
        margin: 4,
        borderRadius: 4,
        backgroundColor: selected ? '#2563eb' : '#cbd5e1',
      }}
    />
  </Pressable>
);

export const Onboarding = () => (
  <Carousel components={{ Dot }}>
    <Screen title="Welcome" />
    <Screen title="Stay in sync" />
    <Screen title="Get started" />
  </Carousel>
);
```

Pass no `components` at all and you get a bare, swipeable track — which is exactly the point.

---

## Slides: `children` vs `data`

**`children`** mounts every slide at once. Right for onboarding flows, banners, a handful of cards.

```tsx
<Carousel>
  {items.map((item) => (
    <Card key={item.id} {...item} />
  ))}
</Carousel>
```

**`data` + `renderItem`** switches to a virtualized `FlatList`, so only the slides near the
viewport are ever mounted. Right for image galleries and long feeds.

```tsx
<Carousel
  data={photos}
  keyExtractor={(photo) => photo.id}
  renderItem={({ item }) => <Photo uri={item.uri} />}
/>
```

Passing both is not an error — `data` wins.

`renderItem` receives `{ item, index, slideWidth, isActive }`. `isActive` is always `false` unless
you set `trackActiveSlides`, because computing it invalidates every slide on each page change,
which is exactly the re-render a virtualized list exists to avoid.

---

## Layout: `visibleSlides`, `peek`, `spacing`

| Prop | What it does |
| --- | --- |
| `visibleSlides` | How many slides fit in the viewport at once. Paging moves a whole group, so 6 slides at `visibleSlides={2}` give **3 pages**, not 6. |
| `spacing` | The gap between slides, in dp. |
| `peek` | How much of the neighbouring slides shows at each edge, in dp. The active group shrinks to make room, so paging still advances exactly one group. `spacing` is added on top, so `peek` is the sliver you actually see. |

```tsx
<Carousel visibleSlides={2} spacing={12} peek={32} components={{ Arrow, Dot }}>
  {cards}
</Carousel>
```

The slide width falls out of the container's measured width:

```text
slideWidth = (containerWidth - 2 × peek - (visibleSlides - 1) × spacing) / visibleSlides
```

When the slide count is not a multiple of `visibleSlides`, the last page holds the remainder and
rests flush against the trailing edge rather than scrolling into empty space.

### Height

Width is measured; height is not. By default the carousel is as tall as its slides, which is what
a banner or a row of cards wants.

Give it a **bounded height** and it fills instead — the track takes whatever the `above` / `below`
slots leave, and the slides stretch to the track. That is what a carousel used as the page itself
needs, with a top bar above it and its dots pinned to the bottom:

```tsx
<View style={{ flex: 1 }}>
  <TopBar />
  <Carousel
    style={{ flex: 1 }}                       // bounded: fills the screen below the bar
    components={{ Pagination: BottomBar }}
    slots={{ pagination: "below" }}
  >
    {steps}                                   // each slide `flex: 1`, stretched to the track
  </Carousel>
</View>
```

Nothing changes for the default case: with an auto height there is no free space to distribute,
so the same carousel in an ordinary column is still sized by its slides.

---

## Responsive props

`visibleSlides` and `peek` also accept a **breakpoint map**, keyed by max width in dp:

```tsx
<Carousel visibleSlides={{ base: 3, 700: 2, 400: 1 }} peek={{ base: 32, 400: 12 }}>
  {cards}
</Carousel>
```

The map reads like stacked media queries — **the narrowest matching entry wins**. Leave a bucket
out and it falls outwards: with no `700` entry, a 500dp container keeps the `base` value.

Crucially, these resolve against the **carousel's own measured width, not the window's**. React
Native has no media queries, so the component measures itself with `onLayout`; a carousel in a
split view or a sidebar therefore adapts to the space it was actually given.

When the grouping changes, the carousel re-finds the page it was on rather than keeping a stale
pixel offset.

---

## The chrome slots

Everything visible is a slot in `components`. Each is optional, and an omitted one renders
**nothing at all**.

| Slot | Props it receives | Notes |
| --- | --- | --- |
| `Arrow` | `CarouselArrowSlotProps` | Fallback used for both directions. |
| `PreviousArrow` / `NextArrow` | `CarouselArrowSlotProps` | Take precedence over `Arrow`. |
| `Dot` | `CarouselDotSlotProps` | Rendered once per **page**, in a row laid out for you. |
| `Pagination` | `CarouselPaginationSlotProps` | Replaces the whole indicator row. Takes precedence over `Dot`. |
| `PlayPauseControl` | `CarouselPlayPauseSlotProps` | Only rendered when `autoPlay` is on. |

### Arrow slot

```tsx
const Arrow = ({ direction, onPress, disabled, accessibilityLabel }: CarouselArrowSlotProps) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    accessibilityState={{ disabled }}
    style={{ opacity: disabled ? 0.35 : 1 }}
  >
    <Icon name={direction === 'previous' ? 'chevron-left' : 'chevron-right'} />
  </Pressable>
);
```

`disabled` is `true` at the first/last page when the carousel does not wrap. **Render it as a
visual disabled state; do not unmount the control** — a button that vanishes under the finger
pressing it takes the user's place in the deck with it. `onPress` is already a no-op when
disabled. The whole arrow pair is hidden when there is only one page.

### Dot and Pagination

`Dot` is the easy path: one element per page, in a row the carousel arranges.

```tsx
const Dot = ({ index, total, selected, onPress, accessibilityLabel }: CarouselDotSlotProps) => (
  <Pressable onPress={onPress} accessibilityLabel={accessibilityLabel}>
    <View style={selected ? styles.dotOn : styles.dotOff} />
  </Pressable>
);
```

`Pagination` is for anything that is not one-element-per-page — a `3 / 8` counter, a progress bar,
a scrubber:

```tsx
const Fraction = ({ page, pageCount }: CarouselPaginationSlotProps) => (
  <Text>{`${page + 1} / ${pageCount}`}</Text>
);
```

### Where the slots go

`slots` picks the coarse position; the `*Style` props handle the rest.

```tsx
<Carousel
  slots={{ arrows: 'overlay', pagination: 'below', playPause: 'overlay' }}
  arrowsStyle={{ paddingHorizontal: 8 }}
  paginationStyle={{ marginTop: 16 }}
/>
```

| Slot | Accepts | Default |
| --- | --- | --- |
| `arrows` | `'overlay'`, `'above'`, `'below'` | `'overlay'` |
| `pagination` | `'overlay'`, `'above'`, `'below'` | `'below'` |
| `playPause` | `'overlay'`, `'above'`, `'below'` | `'overlay'` |

Overlaid slots use `pointerEvents="box-none"`, so the track underneath stays draggable.

---

## `useCarousel`

For anything the slots do not cover, build it yourself from the same state the carousel runs on.
It works in any component rendered inside the carousel — a slide, or any slot.

```tsx
import { Carousel, useCarousel } from '@real-native/carousel';

const ProgressBar = () => {
  const { page, pageCount, next, canGoNext } = useCarousel();
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${((page + 1) / pageCount) * 100}%` }]} />
      <Button title="Next" onPress={() => next()} disabled={!canGoNext} />
    </View>
  );
};

<Carousel components={{ Pagination: ProgressBar }}>{slides}</Carousel>;
```

It hands back the full state and every action:

```ts
{
  page, pageCount, slideCount, visibleSlides, slideWidth,
  canGoPrevious, canGoNext, isPlaying, isDragging,
  next, previous, goTo, goToSlide, play, pause,
}
```

`useCarousel` throws outside a carousel, which surfaces the mistake at the call site rather than
as a mystery null later. Use `useCarouselOptional` for chrome meant to work both inside and out —
it returns `null` instead.

---

## Slide-level state: `useCarouselSlide`

`useCarousel` hands back carousel-wide state; `useCarouselSlide(index)` hands back **one slide's
own** — whether it's active, whether any of it is on screen, and its continuous scroll progress —
without re-rendering every other slide when any of that changes.

```tsx
import { Carousel, useCarouselSlide } from '@real-native/carousel';

const Slide = ({ index, photo }: { index: number; photo: Photo }) => {
  const { isActive, progress } = useCarouselSlide(index);
  return (
    <View style={{ opacity: isActive ? 1 : 0.6, transform: [{ scale: 1 - Math.abs(progress) * 0.1 }] }}>
      <Image source={{ uri: photo.uri }} />
    </View>
  );
};

<Carousel
  data={photos}
  renderItem={({ item, index }) => <Slide index={index} photo={item} />}
/>;
```

It returns:

```ts
{
  index,      // the index you passed in, echoed back
  isActive,   // this slide's page is the current one
  isVisible,  // isActive, plus a neighbour peeking in when `peek` is set
  progress,   // 0 when active, growing towards ±1 off-screen, pinned at ±1 beyond that
}
```

`renderItem` already hands you an `index`; for `children` slides, track your own the way you would
for any other per-item identity. Call the hook from a real component — not inline inside
`renderItem` itself, which React invokes from `FlatList`'s own class-based cell renderer, not a
place hooks can run.

**Why not just recompute `isActive` in `renderItem`?** That's exactly what `trackActiveSlides` does,
and its own docs explain the cost: recomputing `isActive` for *every* slide on *every* page change
defeats slide memoization, which is why it's off by default. `useCarouselSlide` subscribes through a
small store instead of a prop, so a page change only re-renders the slides whose own `isActive` or
`isVisible` actually flipped. `trackActiveSlides` still exists for the rarer case where you need
`isActive` synchronously inside `renderItem` itself, at render time, rather than as a hook one level
down — migrate to `useCarouselSlide` when you don't need that.

`progress` is continuous, so a slide that reads it re-renders on every scroll frame **while within
one page of active** — that's the cost of building a live animation from it, and it's scoped to the
slides near the viewport; one more than a page away is pinned at `±1` and stops re-rendering.

---

## Page state

**Uncontrolled by default.** Use `defaultPage` to start somewhere other than the first page; it is
clamped into range.

**Pass `page` to control it**, and then you own the position. The carousel renders the page you
give it and reports every user-driven move through `onPageChanged`, but it never forces the prop
back:

```tsx
const [page, setPage] = useState(0);

<Carousel page={page} onPageChanged={setPage} components={{ Dot }}>
  {slides}
</Carousel>;
```

Feed `onPageChanged` straight back into `page` — the same contract as a controlled `TextInput`.
Drop the callback on the floor and the track ends up on one page while the chrome still describes
another.

`onPageChanged` fires **once per actual page change**. A swipe emits a scroll event per frame, and
navigating past a non-wrapping end clamps back onto the current page; neither re-notifies you of a
page you are already on.

---

## Page change events

`onPageChanged`'s second argument says **why** the page changed, so a consumer can play a sound,
fire analytics, or trigger haptic feedback without the carousel depending on any of those itself —
the carousel never implements haptics; it just gives you enough to implement your own:

```tsx
<Carousel
  onPageChanged={(page, event) => {
    if (event.userInitiated) {
      Haptics.selectionAsync(); // your choice of haptics library
    }
    analytics.track('carousel_page_changed', event);
  }}
>
  {slides}
</Carousel>;
```

`event` is:

```ts
{
  page,           // the new page — same value as the first argument
  previousPage,   // the page it moved from
  source,         // what triggered the move
  userInitiated,  // shorthand for `source !== 'autoplay'`
}
```

`source` is one of:

| Source | Fires for |
| --- | --- |
| `'drag'` | A swipe, flick, or free scroll — touch, trackpad, mouse wheel. |
| `'next'` / `'previous'` | `next()` / `previous()`, including the built-in `Arrow` slots and the keyboard arrow keys. |
| `'pagination'` | `goTo()` / `goToSlide()`, including the built-in `Dot` and `Pagination` slots and the keyboard Home/End keys. |
| `'autoplay'` | An automatic `autoPlay` tick. |
| `'imperative'` | A call through the `ref` (`CarouselHandle`), from outside the carousel's own chrome. |

The second argument is purely additive — existing `onPageChanged={(page) => ...}` callbacks that
only take the page keep working unchanged.

---

## Interaction and progress events

Beyond page changes, the carousel reports the underlying gesture and scroll lifecycle, so you can
build indicators, parallax, or other custom animation without the carousel depending on an
animation library:

```tsx
<Carousel
  onDragStart={() => console.log('finger down')}
  onDragEnd={() => console.log('finger up')}
  onSnapStart={() => console.log('settling towards a page')}
  onSnapEnd={() => console.log('at rest')}
  onProgress={({ page, absoluteProgress, offset }) => {
    // Drive your own Animated.Value, Reanimated shared value, or state from this —
    // called directly from the scroll handler, not through state, so it never
    // causes the carousel (or anything else) to re-render.
    indicatorPosition.setValue(absoluteProgress);
  }}
>
  {slides}
</Carousel>;
```

| Prop | Fires |
| --- | --- |
| `onDragStart` / `onDragEnd` | The user grabs the track / lets go of it. |
| `onSnapStart` / `onSnapEnd` | The track starts animating towards a resting page / comes to rest on one — a released drag settling, or a `next` / `previous` / `goTo` / `autoPlay` / imperative move. |
| `onProgress` | Every scroll frame, during drags, flings and animated programmatic moves alike. |

`onProgress`'s argument is:

```ts
{
  page,             // nearest page to the current scroll position
  absoluteProgress, // continuous position in page units — whole at rest, fractional mid-scroll
  offset,           // raw scroll offset in dp
}
```

Nothing here is throttled beyond `scrollEventThrottle={16}` on the native side, and none of it goes
through React state — the carousel calls your callback directly, so a 60fps indicator costs nothing
on the carousel's own render.

---

## Imperative control

Pass a `ref` to drive the carousel from a toolbar, a shortcut, or a step in a wizard.

```tsx
const carousel = useRef<CarouselHandle>(null);

<Carousel ref={carousel} loop components={{ Dot }}>{slides}</Carousel>;

carousel.current?.next();
carousel.current?.goToSlide(4);
carousel.current?.page; // already 4
```

| Member | Behaviour |
| --- | --- |
| `next(options?)` / `previous(options?)` | Page by one. Wraps when `loop` or `infinite` is on. |
| `goTo(page, options?)` | Absolute jump. Clamped into range — it never wraps. |
| `goToSlide(slide, options?)` | Jump to the page holding a slide. Not the page index once `visibleSlides` is above 1. |
| `play()` / `pause()` | Start and stop the rotation, exactly as the control does. |
| `page`, `pageCount`, `isPlaying` | Live getters. |

`options` is `{ animated?: boolean }`, defaulting to `true`.

Every method takes the same path as the rendered chrome, so wrapping, reduced motion and the
fire-once `onPageChanged` rule behave identically however the move started. In particular the
handle **reports** rather than seizes: with a controlled `page`, `next()` calls `onPageChanged` and
leaves the prop to you.

A move made through the handle reports [`source: 'imperative'`](#page-change-events) — distinct
from `'next'` / `'previous'` / `'pagination'`, which are reserved for the same actions taken through
the carousel's own rendered chrome or the `useCarousel` hook.

The readable members are getters, not a frozen snapshot, so `handle.page` is already right on the
line after `next()` instead of a render later.

---

## `loop` vs `infinite`

Both wrap around past the ends; they differ in how they get there.

- **`loop`** rewinds: stepping forward from the last page scrolls back to the first. Nothing is
  cloned, so your slides render exactly once.
- **`infinite`** is seamless: a copy of the last page is rendered *before* the first one (and a
  copy of the first after the last), so paging past either end keeps moving in the same direction.
  Once the scroll settles the carousel silently re-anchors onto the real page. Implies `loop`.

```tsx
<Carousel infinite visibleSlides={2} spacing={12} peek={32} components={{ Arrow, Dot }}>
  {cards}
</Carousel>
```

`infinite` **clones your slides**, so avoid it for slides that own uncloneable side effects —
autoplaying media, unique ids, per-slide fetches. The clones are hidden from assistive technology,
so a screen reader still counts and reads each slide exactly once.

Motion is perfectly seamless when the slide count is a multiple of `visibleSlides`. With a
remainder the last group overlaps the first (5 slides in groups of 2 give pages `[1,2] [3,4]
[5,1]`), so the wrap shifts by the leftover slides.

Pair `infinite` with `peek` so the leading edge is never blank on the first page.

---

## Auto-play

```tsx
<Carousel autoPlay interval={4000} components={{ Dot, PlayPauseControl }}>
  {slides}
</Carousel>
```

The rotation stops on its own while:

- the user is dragging the track — fighting a finger is never right;
- the app is in the background — otherwise the deck advances twenty pages behind a lock screen;
- the user has pressed pause.

It **wraps at the end even without `loop`**, because a deck that silently stops on the last slide
reads as broken rather than finished.

> **WCAG 2.2.2 requires a way to stop content that moves automatically.** Render a
> `PlayPauseControl` slot — or your own control via `useCarousel` — whenever `autoPlay` is on. The
> carousel supplies the behaviour; only you can supply the button.

---

## Accessibility

- **`accessibilityLabel`** names the carousel (`'Carousel'` by default). Give it something
  specific when a screen holds more than one.
- **Every visible string is a prop**: `accessibilityLabel`, `paginationLabel`, `pageLabel`,
  `slideLabel`, `statusLabel`, `previousLabel`, `nextLabel`, `pauseLabel`, `playLabel`. The last
  three formatters take `(index, total)` with a zero-based `index`.
- **Page changes are announced.** A change fires
  `AccessibilityInfo.announceForAccessibility(statusLabel(page, pageCount))` — React Native's
  counterpart of a live region, since both cues are otherwise invisible to a screen reader: the
  dot moving, and the track scrolling under slides that are all mounted either way.
  It stays silent on mount, for a single-page deck, and **while an auto-play rotation is running**
  — a carousel that speaks every few seconds is unusable. Pass `statusLabel={null}` to silence it
  entirely.
- **Every slide is labelled** from `slideLabel`, defaulting to `"3 of 8"`.
- **`infinite` clones are hidden** with `accessibilityElementsHidden` and
  `importantForAccessibility="no-hide-descendants"`, so the deck is never read twice.
- **Arrows report `disabled` rather than unmounting**, so focus is never dropped mid-navigation.
- **Reduced motion is honoured.** With the OS setting on, every programmatic move jumps straight
  to the page instead of animating.
- **The track is keyboard operable on web.** It takes focus — a scroll container is not in the tab
  order by default, which leaves a pointer as the only way to move it — and pages with `←` / `→`,
  jumping to the ends with `Home` / `End`. The arrows follow what the user *sees*, so they are
  mirrored under `I18nManager.isRTL`. Any other key is left to the browser, never swallowed.
- **Named containers carry a role on web.** The carousel, each slide and the indicator row are
  `role="group"`, because ARIA drops a name on a role-less element: without it the
  `accessibilityLabel`, `slideLabel` and `paginationLabel` you pass would be announced on native
  and silently ignored in a browser.

---

## Right to left

Handled through `I18nManager.isRTL` — there is no prop. Page indices stay **logical** everywhere
(0 is always the first page, growing as you page forward) and are mirrored into physical scroll
offsets at the one boundary that touches the scroller, because a right-to-left scroller puts
offset 0 at its *right* edge. Everything else — the dots, the arrows, `goTo`, the wrap arithmetic
— is direction-agnostic as a result.

---

## Performance

The carousel is built to stay out of the way:

- **No native dependencies and no animation library.** Scrolling is the platform's own, running
  off the JS thread.
- **Snap points, not `pagingEnabled`.** Paging snaps to whole viewport widths, which would break
  `visibleSlides`, `peek` and `spacing` at once. `snapToOffsets` plus `disableIntervalMomentum`
  means a fling advances exactly one page instead of skating past several.
- **Scroll events are cheap.** Each one costs a small nearest-offset lookup and a comparison; a
  re-render only happens when the page actually changes.
- **`getItemLayout` is supplied** in the virtualized mode — the offsets are already known, so the
  list never needs a measuring pass — along with `removeClippedSubviews` and a tight `windowSize`.
- **The geometry is memoized**, and `onLayout` only commits a genuinely different width, so a
  re-layout does not re-render every slide.
- **`isActive` is opt-in** (`trackActiveSlides`) precisely so slide memoization survives by
  default.
- **`onProgress` bypasses React state entirely.** It's called directly from the scroll handler, so
  a 60fps indicator or parallax effect never re-renders the carousel.
- **`useCarouselSlide` subscribes through a store, not context.** A page change re-renders only the
  slides whose own `isActive` or `isVisible` actually flipped, and `progress` is pinned once a slide
  is more than a page away — so it stays cheap across a long deck.

For long decks prefer `data`/`renderItem` over `children`: `children` mounts every slide.

---

## Platform support

| Platform | Status |
| --- | --- |
| iOS (Expo & bare) | Supported |
| Android (Expo & bare) | Supported |
| Expo Go | Supported — nothing to prebuild |
| react-native-web | Supported |
| New Architecture (Fabric) | Supported — core components only |

Requires `react >= 18` and `react-native >= 0.74`.

**On web**, `snapToOffsets` is a native-only prop, so the same snapping is expressed as CSS
scroll-snap (`scroll-snap-type: x mandatory`, with snap points on page boundaries only). This is
applied automatically under `Platform.OS === 'web'`. Two accessibility details are web-only for
the same reason: the track is put in the tab order and handles arrow keys, and named containers
are given `role="group"` — neither has a meaning on native, where a view is grouped by the
platform and keys never reach a scroller.

---

## API reference

Full generated docs: `npm run docs` (TypeDoc → `docs/api`).

### `CarouselProps`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Slides, all mounted. |
| `data` | `readonly TItem[]` | — | Slides, virtualized. Wins over `children`. |
| `renderItem` | `(info) => ReactElement \| null` | — | Renders one `data` slide. |
| `keyExtractor` | `(item, index) => string` | index | Stable key for a `data` entry. |
| `visibleSlides` | `ResponsiveValue<number>` | `1` | Slides per page (integer ≥ 1). |
| `peek` | `ResponsiveValue<number>` | `0` | Neighbour sliver at each edge, in dp. |
| `spacing` | `number` | `0` | Gap between slides, in dp. |
| `loop` | `boolean` | `false` | Wrap by rewinding. |
| `infinite` | `boolean` | `false` | Wrap seamlessly, by cloning. Implies `loop`. |
| `page` | `number` | — | Controlled page index. |
| `defaultPage` | `number` | `0` | Starting page when uncontrolled. |
| `onPageChanged` | `(page: number, event: CarouselPageChangeEvent) => void` | — | Fires once per actual change. |
| `autoPlay` | `boolean` | `false` | Rotate automatically. |
| `interval` | `number` | `3000` | Milliseconds between advances. |
| `components` | `CarouselComponents` | `{}` | The chrome to render. |
| `slots` | `CarouselSlotLayout` | `{}` | Where each slot goes. |
| `style` | `StyleProp<ViewStyle>` | — | Outer wrapper. |
| `trackStyle` | `StyleProp<ViewStyle>` | — | The scrollable track. |
| `slideStyle` | `StyleProp<ViewStyle>` | — | Every slide wrapper. |
| `paginationStyle` | `StyleProp<ViewStyle>` | — | The indicator row. |
| `arrowsStyle` | `StyleProp<ViewStyle>` | — | The arrows container. |
| `accessibilityLabel` | `string` | `'Carousel'` | Names the carousel. |
| `paginationLabel` | `string` | `'Carousel pages'` | Names the indicator group. |
| `pageLabel` | `(i, total) => string` | `` `Page ${i + 1}` `` | Names each indicator. |
| `slideLabel` | `(i, total) => string` | `` `${i + 1} of ${total}` `` | Names each slide. |
| `statusLabel` | `(i, total) => string \| null` | `` `Page ${i+1} of ${total}` `` | Announced on change. `null` to silence. |
| `previousLabel` | `string` | `'Previous slide'` | Previous arrow. |
| `nextLabel` | `string` | `'Next slide'` | Next arrow. |
| `pauseLabel` | `string` | `'Pause automatic rotation'` | Pause control. |
| `playLabel` | `string` | `'Resume automatic rotation'` | Play control. |
| `trackActiveSlides` | `boolean` | `false` | Compute `isActive` per slide in `renderItem`. See `useCarouselSlide` for the usual alternative. |
| `onDragStart` / `onDragEnd` | `() => void` | — | Drag lifecycle. |
| `onSnapStart` / `onSnapEnd` | `() => void` | — | Snap lifecycle — settling towards a page / at rest on one. |
| `onProgress` | `(event: CarouselProgressEvent) => void` | — | Raw scroll position, on every frame. |
| `testID` | `string` | — | On the outer view; the track gets `` `${testID}-track` ``. |

### Exports

```ts
import {
  Carousel,
  useCarousel,
  useCarouselOptional,
  useCarouselSlide,
  type CarouselActions,
  type CarouselArrowSlotProps,
  type CarouselComponents,
  type CarouselContextValue,
  type CarouselDotSlotProps,
  type CarouselHandle,
  type CarouselNavigateOptions,
  type CarouselPageChangeEvent,
  type CarouselPageChangeSource,
  type CarouselPaginationSlotProps,
  type CarouselPlayPauseSlotProps,
  type CarouselProgressEvent,
  type CarouselProps,
  type CarouselRenderItem,
  type CarouselRenderItemInfo,
  type CarouselSlideState,
  type CarouselSlotLayout,
  type CarouselState,
  type ResponsiveMap,
  type ResponsiveValue,
} from '@real-native/carousel';
```

---

## Troubleshooting

**Nothing renders / the slides have no width.**
The carousel measures itself, so it needs a definite width from its parent. Inside an
unconstrained flex parent it measures 0. Give the parent a width, or `flex: 1`.

**The dots do not move when I swipe.**
Check that you have not passed `scrollEnabled={false}` through, and that no parent horizontal
scroll view is claiming the gesture.

**A controlled carousel snaps back.**
`page` is a controlled prop: feed `onPageChanged` back into it. Without that the carousel keeps
rendering the page you gave it.

**`useCarousel must be called inside a <Carousel>`.**
The component calling it is rendered outside the carousel. Pass it through `components`, or render
it as a slide.

**Autoplay does not start.**
It pauses while the app is backgrounded and while a drag is in progress. It also stops if
`interval` is `0` or negative.

**`infinite` shows duplicated media.**
That is the clone page. Use `loop` instead for slides that cannot be duplicated.

---

## Contributing

```bash
npm install

npm run lint          # ESLint (super-configs React Native preset)
npm run format:check  # Biome
npm run typecheck     # tsc, source + e2e projects
npm run test          # Jest + React Native Testing Library
npm run test:coverage # …with the 90% threshold enforced
npm run storybook     # Storybook on react-native-web
npm run test:e2e      # Playwright, against that Storybook
npm run test:visual   # Playwright, comparing screenshots of the layout stories
npm run build         # react-native-builder-bob
npm run docs          # TypeDoc
```

### Visual regression

`npm run test:visual` renders the stories whose subject is a layout — the cards, the page-level
screen — and compares them against the baselines in `e2e/__screenshots__/<platform>/`. It is a
separate Playwright project, so `npm run test:e2e` never depends on pixels.

Baselines are **per platform**: Chrome renders the same page with different fonts and antialiasing
on macOS and on Linux, and a single shared baseline would either be permanently red or so tolerant
that it catches nothing. Regenerate yours after an intentional change, and read the diff before
committing it:

```bash
npm run test:visual -- --update-snapshots
```

CI does not gate on this yet, because the runner is Linux and only the macOS baselines are
committed. To make it a gate, generate the Linux set once in the pinned browser image and commit
it, then run the same image in the workflow:

```bash
docker run --rm -v "$PWD":/work -w /work mcr.microsoft.com/playwright:v1.62.1-noble \
  bash -c "npm ci && npm run test:visual -- --update-snapshots"
```

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`,
`perf:`, `refactor:`, `docs:`, `chore:`…) and releases are cut automatically by semantic-release
on merge to `main`.

The Storybook doubles as the e2e fixture: the mocked chrome lives in `src/stories/mocks.tsx` and is
a reasonable starting point for your own.

### Checking a story at a device width

The toolbar's viewport picker offers Phone, Large phone, Tablet, Laptop and Desktop (rotate for
landscape), which is how you watch a responsive map hand over without dragging a window. The
preview frame caps itself at 720dp while the viewport is left responsive, and gives that width away
as soon as a device is picked — otherwise Tablet and Desktop would both render a 720dp carousel.
Add or change devices in `.storybook/preview.tsx`.

## License

MIT © [pilmee](https://github.com/ElJijuna)
