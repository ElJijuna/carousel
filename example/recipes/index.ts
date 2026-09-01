import type { ComponentType } from 'react';

import { AutoPlay } from './AutoPlay';
import { Basic } from './Basic';
import { Coverflow } from './Coverflow';
import { CreditCards } from './CreditCards';
import { DayCalendar } from './DayCalendar';
import { Gallery } from './Gallery';
import { PageLayout } from './PageLayout';
import { SplitCards } from './SplitCards';

/** One entry in the menu, and the screen it opens. */
export interface Recipe {
  /** Stable id, used as the list key and as the selected value. */
  id: string;
  /** Row title in the menu, and the header of the screen it opens. */
  title: string;
  /** One line under the title: what this recipe is here to show. */
  blurb: string;
  /**
   * Whether the screen wants the whole viewport rather than a scrolling page.
   *
   * Most recipes are a carousel sitting in a page and are happier with room to
   * breathe underneath; `PageLayout` is the carousel *being* the page and is
   * sized by `flex`, which needs a parent that is not a scroll view.
   */
  fills?: boolean;
  Screen: ComponentType;
}

export const recipes: readonly Recipe[] = [
  {
    id: 'basic',
    title: 'Basic',
    blurb: 'Arrows and dots. Start here on a device you have not tried before.',
    Screen: Basic,
  },
  {
    id: 'gallery',
    title: 'Gallery with a thumbnail strip',
    blurb: 'Two carousels, one selection — controlled picture, ref-driven strip.',
    Screen: Gallery,
  },
  {
    id: 'coverflow',
    title: 'Coverflow',
    blurb: 'Per-slide scroll progress driving scale and opacity, no animation library.',
    Screen: Coverflow,
  },
  {
    id: 'day-calendar',
    title: 'Day calendar',
    blurb: 'Responsive visibleSlides with a header in the pagination slot. Rotate the device.',
    Screen: DayCalendar,
  },
  {
    id: 'split-cards',
    title: 'Split cards',
    blurb: 'Virtualized data mode with peek — halves that follow the computed slide width.',
    Screen: SplitCards,
  },
  {
    id: 'credit-cards',
    title: 'Wallet',
    blurb: 'loop, which rewinds across the deck rather than cloning slides.',
    Screen: CreditCards,
  },
  {
    id: 'page-layout',
    title: 'Full-screen onboarding',
    blurb: 'The carousel as the whole screen, dots and the primary button in one bar.',
    fills: true,
    Screen: PageLayout,
  },
  {
    id: 'autoplay',
    title: 'Auto-play',
    blurb: 'Rotates on a timer. Background the app and come back.',
    Screen: AutoPlay,
  },
];
