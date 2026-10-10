import type { Preview } from '@storybook/react';
import type { ReactNode } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { RESPONSIVE_VIEWPORT_VALUE, type Viewport } from 'storybook/viewport';
import type { catalog } from '../src/stories/catalog';
import { demoTokens } from '../src/stories/tokens';

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

const frameStyles = StyleSheet.create({
  canvas: { backgroundColor: demoTokens.color.canvas },
  frame: { padding: 24, width: '100%', alignSelf: 'center', gap: 24 },
  header: { gap: 8 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2, color: demoTokens.color.accent },
  title: { fontSize: 28, fontWeight: '700', color: demoTokens.color.ink },
  description: { fontSize: 14, lineHeight: 21, color: demoTokens.color.caption },
  surface: {
    backgroundColor: demoTokens.color.surface,
    borderRadius: demoTokens.radius.large,
    paddingVertical: 24,
  },
  instruction: {
    gap: 6,
    borderLeftWidth: 3,
    borderLeftColor: demoTokens.color.accent,
    paddingLeft: 16,
  },
  instructionLabel: { fontSize: 12, fontWeight: '700', color: demoTokens.color.ink },
});

type CatalogEntry = (typeof catalog)[keyof typeof catalog];

const Frame = ({
  children,
  deviceWidth,
  standalone,
  entry,
}: {
  children: ReactNode;
  deviceWidth: boolean;
  standalone: boolean;
  entry?: CatalogEntry;
}) => {
  // Standalone canvases fill the viewport minus Storybook's 16px outer padding.
  // Docs previews keep their natural height so examples remain easy to scan.
  const { height } = useWindowDimensions();
  return (
    <View style={[frameStyles.canvas, standalone && { minHeight: Math.max(0, height - 32) }]}>
      <View style={[frameStyles.frame, !deviceWidth && { maxWidth: 720 }]}>
        {entry ? (
          <View style={frameStyles.header}>
            <Text style={frameStyles.eyebrow}>{`CAROUSEL / ${entry.group.toUpperCase()}`}</Text>
            <Text accessibilityRole="header" style={frameStyles.title}>
              {entry.title}
            </Text>
            <Text style={frameStyles.description}>{entry.description}</Text>
          </View>
        ) : null}
        <View style={frameStyles.surface}>{children}</View>
        {entry ? (
          <View style={frameStyles.instruction}>
            <Text style={frameStyles.instructionLabel}>Try it</Text>
            <Text style={frameStyles.description}>{entry.instruction}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const preview: Preview = {
  parameters: {
    options: {
      storySort: {
        order: [
          'Carousel',
          ['Fundamentals', 'Navigation', 'Autoplay', 'Indicators', 'Transitions', 'Recipes'],
        ],
      },
    },
    controls: { matchers: { color: /(background|color)$/i } },
    a11y: { test: 'todo' },
    viewport: { options: viewports },
  },
  decorators: [
    (Story, context) => (
      <Frame
        standalone={context.viewMode === 'story'}
        deviceWidth={isDeviceWidth(context.globals.viewport)}
        entry={context.parameters.catalog}
      >
        <Story />
      </Frame>
    ),
  ],
};

export default preview;
