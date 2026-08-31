import type { Preview } from '@storybook/react';
import type { ReactNode } from 'react';
import { View } from 'react-native';

const Frame = ({ children }: { children: ReactNode }) => (
  // A definite width, so `visibleSlides` and `peek` have something real to
  // divide up — a carousel in an unconstrained flex parent measures 0.
  <View style={{ padding: 24, maxWidth: 720, width: '100%', alignSelf: 'center' }}>{children}</View>
);

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i } },
    a11y: { test: 'todo' },
  },
  decorators: [
    (Story) => (
      <Frame>
        <Story />
      </Frame>
    ),
  ],
};

export default preview;
