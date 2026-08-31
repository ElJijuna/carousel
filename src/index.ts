/**
 * `@real-native/carousel` — a headless, dependency-free horizontal carousel for
 * React Native, Expo and react-native-web.
 *
 * The {@link Carousel} owns every behaviour and draws no chrome; you supply the
 * arrows, dots and controls through its `components` slots, or build your own
 * from {@link useCarousel}.
 *
 * @packageDocumentation
 */

export { Carousel } from './Carousel';
export { useCarousel, useCarouselOptional } from './CarouselContext';
export type {
  CarouselActions,
  CarouselArrowSlotProps,
  CarouselComponents,
  CarouselContextValue,
  CarouselDotSlotProps,
  CarouselHandle,
  CarouselNavigateOptions,
  CarouselPaginationSlotProps,
  CarouselPlayPauseSlotProps,
  CarouselProps,
  CarouselRenderItem,
  CarouselRenderItemInfo,
  CarouselSlotLayout,
  CarouselState,
  ResponsiveMap,
  ResponsiveValue,
} from './types';
