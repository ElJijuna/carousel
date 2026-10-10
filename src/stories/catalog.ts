/** Shared catalog copy and canonical Storybook routes. */
export const catalog = {
  basic: {
    group: 'Fundamentals',
    title: 'One slide, one page',
    description: 'A minimal carousel with selectable page indicators.',
    instruction: 'Swipe left or select a dot. The slide and selected indicator should agree.',
  },
  'no-chrome': {
    group: 'Fundamentals',
    title: 'Content comes first',
    description: 'The carousel provides gestures without adding controls.',
    instruction: 'Swipe in either direction. Navigation works without arrows or indicators.',
  },
  'with-arrows': {
    group: 'Fundamentals',
    title: 'Accessible navigation',
    description: 'Arrows and dots share the same page state.',
    instruction: 'Use the arrows, then select a dot. Controls stop at the ends.',
  },
  'visible-slides': {
    group: 'Fundamentals',
    title: 'A page of cards',
    description: 'Multiple slides move together as one page.',
    instruction:
      'Advance once. Three cards should move together; change visibleSlides to regroup them.',
  },
  'peek-and-spacing': {
    group: 'Fundamentals',
    title: 'A hint of what comes next',
    description: 'Spacing and peeking make neighbouring content discoverable.',
    instruction:
      'Swipe and adjust peek or spacing. The neighbours remain visible beside each page.',
  },
  responsive: {
    group: 'Fundamentals',
    title: 'Layout follows the container',
    description: 'Responsive maps resolve against the available carousel width.',
    instruction:
      'Switch between Phone and Tablet. The slide count and peeking change at the breakpoints.',
  },
  virtualized: {
    group: 'Fundamentals',
    title: 'A larger collection',
    description: 'Five hundred records use the data rendering path.',
    instruction: 'Navigate several pages. The fraction updates while cards are rendered as needed.',
  },
  'fill-height': {
    group: 'Fundamentals',
    title: 'Fill the available height',
    description: 'Children and data slides both stretch inside a bounded track.',
    instruction:
      'Swipe both examples. Each coloured slide should fill its track from top to bottom.',
  },
  loop: {
    group: 'Navigation',
    title: 'Wrap with controls',
    description: 'Loop allows controls to navigate between the first and last pages.',
    instruction:
      'Go back from the first page. The last page appears; gestures still respect the ends.',
  },
  infinite: {
    group: 'Navigation',
    title: 'An endless sequence',
    description: 'Cloned neighbours keep gestures continuous at both ends.',
    instruction:
      'Swipe past the last page and back past the first. The sequence continues without a gap.',
  },
  controlled: {
    group: 'Navigation',
    title: 'Your state owns the page',
    description: 'External buttons and carousel interactions update one page value.',
    instruction: 'Select Last, then swipe back. The page readout should follow both interactions.',
  },
  'imperative-handle': {
    group: 'Navigation',
    title: 'Navigate from a toolbar',
    description: 'A ref exposes previous, next and goToSlide for external controls.',
    instruction:
      'Press Slide 5, then Previous or Next. The carousel follows the imperative commands.',
  },
  'auto-play': {
    group: 'Autoplay',
    title: 'Automatic playback',
    description: 'Each slide stays visible for the configured interval.',
    instruction: 'Pause playback and resume it. Slides advance automatically while playing.',
  },
  'auto-play-progress': {
    group: 'Autoplay',
    title: 'Time you can see',
    description: 'The active built-in dot fills during the visible slide duration.',
    instruction: 'Pause halfway through, then resume. The fill continues from the same point.',
  },
  'custom-auto-play-progress': {
    group: 'Autoplay',
    title: 'Build your own timer',
    description:
      'A custom indicator reads the shared Animated.Value without rendering the carousel each frame.',
    instruction:
      'Pause and change interval. Watch the custom fill and clock readout respond together.',
  },
  'fraction-pagination': {
    group: 'Indicators',
    title: 'Position as a fraction',
    description: 'A pagination slot can replace the entire indicator row.',
    instruction: 'Navigate with arrows. The fraction should report the current page and total.',
  },
  'custom-chrome-via-hook': {
    group: 'Indicators',
    title: 'Controls from context',
    description: 'useCarousel powers a progress bar and custom navigation.',
    instruction: 'Press Forward and Back. The bar follows the page and controls dim at the ends.',
  },
  'overlay-pagination': {
    group: 'Indicators',
    title: 'Indicators over content',
    description: 'Overlay placement respects explicit edge insets.',
    instruction:
      'Navigate with the dots. They stay anchored near the top with room for a safe area.',
  },
  'default-indicators': {
    group: 'Indicators',
    title: 'Two indicator treatments',
    description: 'The included accessible dot accepts custom dimensions and selected styles.',
    instruction:
      'Select a dot in each example. Rounded dots and line indicators share the same behaviour.',
  },
  card: {
    group: 'Transitions',
    title: 'Turn the card',
    description: 'Each page rotates around its central vertical axis to reveal the next card.',
    instruction:
      'Drag left to reveal the chart. A short drag returns; passing the last card wraps to the first.',
  },
  scale: {
    group: 'Transitions',
    title: 'Depth through scale',
    description: 'Slide progress makes neighbouring artwork smaller.',
    instruction: 'Drag slowly. The centre card grows while the outgoing card shrinks.',
  },
  fade: {
    group: 'Transitions',
    title: 'Focus through opacity',
    description: 'Slide progress fades content as it leaves the centre.',
    instruction:
      'Drag halfway and release. Opacity should follow the gesture and settle with the slide.',
  },
  parallax: {
    group: 'Transitions',
    title: 'Artwork in motion',
    description: 'Overscanned artwork moves independently inside each slide.',
    instruction:
      'Drag slowly. The image moves at a different speed while the title follows the card.',
  },
  'credit-cards': {
    group: 'Recipes',
    title: 'A wallet you can browse',
    description: 'A countable card stack uses peeking and loop navigation.',
    instruction:
      'Swipe through the wallet, then use an arrow at an end. Cards keep their identity.',
  },
  'split-cards': {
    group: 'Recipes',
    title: 'Editorial cards',
    description: 'Copy and local artwork share equal halves of each slide.',
    instruction:
      'Swipe, then change visibleSlides. The split should remain centred at every width.',
  },
  'page-layout': {
    group: 'Recipes',
    title: 'A complete onboarding screen',
    description: 'The carousel fills the space between a header and a shared action footer.',
    instruction:
      'Press Next page through the tour. On the last page, Start over restarts the sequence.',
  },
  'day-calendar': {
    group: 'Recipes',
    title: 'Browse days, keep your selection',
    description: 'Paging and selected-day state are deliberately independent.',
    instruction:
      'Pick a day, then navigate the strip. The agenda stays selected until you choose another day.',
  },
  coverflow: {
    group: 'Recipes',
    title: 'A deck of albums',
    description: 'Scale and opacity combine with infinite peeking to create depth.',
    instruction:
      'Drag slowly across an end. The centre album stays prominent and neighbours continue on both sides.',
  },
  gallery: {
    group: 'Recipes',
    title: 'A connected photo gallery',
    description:
      'A controlled photo carousel and an imperative thumbnail strip share one selection.',
    instruction:
      'Choose a thumbnail, then swipe the photo. The highlighted thumbnail stays in view.',
  },
} as const;

export type CatalogStory = keyof typeof catalog;

export function storyId(story: CatalogStory): string {
  return `carousel-${catalog[story].group.toLowerCase()}--${story}`;
}

export function catalogParameters(story: CatalogStory) {
  const entry = catalog[story];
  return {
    catalog: entry,
    docs: { description: { story: `${entry.description}\n\n${entry.instruction}` } },
  };
}
