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
- [Page state](#page-state)
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
applied automatically under `Platform.OS === 'web'`.

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
| `onPageChanged` | `(page: number) => void` | — | Fires once per actual change. |
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
| `trackActiveSlides` | `boolean` | `false` | Compute `isActive` per slide. |
| `onDragStart` / `onDragEnd` | `() => void` | — | Drag lifecycle. |
| `testID` | `string` | — | On the outer view; the track gets `` `${testID}-track` ``. |

### Exports

```ts
import {
  Carousel,
  useCarousel,
  useCarouselOptional,
  type CarouselActions,
  type CarouselArrowSlotProps,
  type CarouselComponents,
  type CarouselContextValue,
  type CarouselDotSlotProps,
  type CarouselHandle,
  type CarouselNavigateOptions,
  type CarouselPaginationSlotProps,
  type CarouselPlayPauseSlotProps,
  type CarouselProps,
  type CarouselRenderItem,
  type CarouselRenderItemInfo,
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
npm run build         # react-native-builder-bob
npm run docs          # TypeDoc
```

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`,
`perf:`, `refactor:`, `docs:`, `chore:`…) and releases are cut automatically by semantic-release
on merge to `main`.

The Storybook doubles as the e2e fixture: the mocked chrome lives in `src/stories/mocks.tsx` and is
a reasonable starting point for your own.

## License

MIT © [pilmee](https://github.com/ElJijuna)
