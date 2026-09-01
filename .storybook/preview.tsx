import type { Preview } from '@storybook/react';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { RESPONSIVE_VIEWPORT_VALUE, type Viewport } from 'storybook/viewport';

/**
 * The devices the viewport toolbar offers.
 *
 * A short, opinionated set rather than Storybook's full device list: what this
 * carousel has to be checked at is the widths where a responsive map changes
 * hands — the stories switch `visibleSlides` and `peek` at 460, 620 and 700dp —
 * and one width per class of device crosses all of them. Use the toolbar's
 * rotate button for landscape rather than adding a second entry per device.
 */
const viewports = {
  phone: {
    name: 'Phone',
    styles: { width: '390px', height: '844px' },
    type: 'mobile',
  },
  phoneLarge: {
    name: 'Large phone',
    styles: { width: '430px', height: '932px' },
    type: 'mobile',
  },
  tablet: {
    name: 'Tablet',
    styles: { width: '834px', height: '1112px' },
    type: 'tablet',
  },
  laptop: {
    name: 'Laptop',
    styles: { width: '1280px', height: '800px' },
    type: 'desktop',
  },
  desktop: {
    name: 'Desktop',
    styles: { width: '1512px', height: '945px' },
    type: 'desktop',
  },
} satisfies Record<string, Viewport>;

/**
 * Whether the toolbar is currently pinning the preview to a device width.
 *
 * The global is a `{ value, isRotated }` object, a bare key, or absent
 * depending on how it was set, and "Reset viewport" is a value of its own
 * rather than an empty one — so all three shapes collapse to this question.
 */
const isDeviceWidth = (viewport: unknown): boolean => {
  const value =
    typeof viewport === 'string' ? viewport : (viewport as { value?: string } | undefined)?.value;
  return value !== undefined && value !== RESPONSIVE_VIEWPORT_VALUE;
};

const Frame = ({ children, deviceWidth }: { children: ReactNode; deviceWidth: boolean }) => (
  // A definite width, so `visibleSlides` and `peek` have something real to
  // divide up — a carousel in an unconstrained flex parent measures 0.
  //
  // The 720dp cap keeps a story from stretching across a monitor while the
  // preview is responsive. Once the toolbar pins a device, the frame gives
  // that width away instead: the point of picking Tablet is to see the
  // carousel at a tablet's width, not at 720 inside one.
  <View
    style={[{ padding: 24, width: '100%', alignSelf: 'center' }, !deviceWidth && { maxWidth: 720 }]}
  >
    {children}
  </View>
);

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i } },
    a11y: { test: 'todo' },
    viewport: { options: viewports },
  },
  decorators: [
    (Story, context) => (
      <Frame deviceWidth={isDeviceWidth(context.globals.viewport)}>
        <Story />
      </Frame>
    ),
  ],
};

export default preview;
