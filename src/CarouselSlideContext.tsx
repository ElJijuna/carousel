import { createContext, useContext, useSyncExternalStore } from 'react';

import type { SlideStore } from './hooks/useSlideStore';
import type { CarouselSlideState } from './types';

const SlideStoreContext = createContext<SlideStore | null>(null);

/** Internal: `Carousel` mounts this once, around the track. */
export const SlideStoreProvider = SlideStoreContext.Provider;

/**
 * Local state for one slide — whether it is active, whether any of it is on
 * screen, and its continuous scroll progress — without re-rendering every
 * other slide when any of that changes.
 *
 * Pass the slide's own index: the `data` mode's `renderItem` already hands you
 * one; for `children` slides, track it yourself the way you would for any
 * other per-item identity.
 *
 * ```tsx
 * renderItem={({ item, index }) => {
 *   const { isActive, progress } = useCarouselSlide(index);
 *   return (
 *     <View style={{ opacity: isActive ? 1 : 0.5 - Math.abs(progress) * 0.3 }}>
 *       <Card item={item} />
 *     </View>
 *   );
 * }}
 * ```
 *
 * Subscribes through a small external store rather than context, so a page
 * change only re-renders the slides whose `isActive` or `isVisible` actually
 * flipped — not the whole list, which is the cost `trackActiveSlides`
 * documents and this hook exists to avoid. `progress` is continuous, so a
 * slide that reads it re-renders on every scroll frame; one that only reads
 * `isActive` / `isVisible` does not.
 *
 * @throws if called outside a `Carousel`.
 */
export function useCarouselSlide(index: number): CarouselSlideState {
  const store = useContext(SlideStoreContext);
  if (store === null) {
    throw new Error(
      'useCarouselSlide must be called inside a <Carousel>. Render it from a ' +
        'slide — either as a child or from `renderItem`.',
    );
  }
  return useSyncExternalStore(store.subscribe, () => store.getDerivedForIndex(index));
}
