import type { Meta } from '@storybook/react';
import { fn } from 'storybook/test';
import { Carousel } from '../Carousel';

const noControl = { control: false } as const;
const structuralArgTypes = Object.fromEntries(
  [
    'children',
    'data',
    'renderItem',
    'keyExtractor',
    'components',
    'style',
    'trackStyle',
    'slideStyle',
    'paginationStyle',
    'arrowsStyle',
    'pageLabel',
    'slideLabel',
    'statusLabel',
  ].map((name) => [name, noControl]),
);
export const storyMeta = {
  component: Carousel,
  // Turns the props table below into an actual page: without it the component
  // description, the `table.type` summaries and the argTypes are computed and
  // then never rendered anywhere.
  tags: ['autodocs'],
  parameters: {
    jest: {
      componentPath: 'src/Carousel.tsx',
    },
    docs: {
      description: {
        component:
          'A headless horizontal carousel. It owns every behaviour and draws nothing but the ' +
          'track — every arrow, dot and control below comes from the `components` slots, ' +
          'mocked in `src/stories/mocks.tsx`.',
      },
    },
  },
  argTypes: {
    ...structuralArgTypes,
    mode: { control: 'select', options: ['classic', 'card'] },
    // `visibleSlides` and `peek` are `number | ResponsiveMap<number>`, which
    // Storybook can only offer as a JSON editor. Every story but `Responsive`
    // passes the plain number, so the number control is the useful one; the
    // responsive stories put the object editor back themselves.
    //
    // `type` is narrowed to `number` as well, not just `control`: Storybook
    // coerces `?args=visibleSlides:2` against the *type*, and silently drops
    // the value when that type is a union it cannot parse — which is what made
    // a shared control link arrive with the control back at its default.
    // `table.type` keeps the docs showing the real signature.
    visibleSlides: {
      type: { name: 'number' },
      table: { type: { summary: 'number | ResponsiveMap<number>' } },
      control: { type: 'number', min: 1, max: 6, step: 1 },
    },
    peek: {
      type: { name: 'number' },
      table: { type: { summary: 'number | ResponsiveMap<number>' } },
      control: { type: 'range', min: 0, max: 96, step: 4 },
    },
    spacing: { control: { type: 'range', min: 0, max: 48, step: 2 } },
    interval: { control: { type: 'range', min: 500, max: 8000, step: 500 } },
    page: { control: { type: 'number', min: 0, step: 1 } },
    defaultPage: { control: { type: 'number', min: 0, step: 1 } },
  },
  // Defaults for every story, so the controls open populated rather than as a
  // row of empty "Set number" buttons. The callbacks are spies, which is what
  // puts every page change and drag in the Actions panel.
  args: {
    mode: 'classic',
    onPageChanged: fn(),
    onDragStart: fn(),
    onDragEnd: fn(),
    visibleSlides: 1,
    spacing: 0,
    peek: 0,
    loop: false,
    infinite: false,
    autoPlay: false,
    interval: 3000,
    trackActiveSlides: false,
  },
} satisfies Meta<typeof Carousel>;
