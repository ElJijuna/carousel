import type { Meta, StoryObj } from '@storybook/react';
import { Text, View } from 'react-native';
import type { Carousel } from '../Carousel';
import { catalogParameters } from './catalog';
import { MockArrow, MockDot, mockCovers, palette } from './mocks';
import { storyMeta } from './storyMeta';
import { TransitionSlide } from './TransitionSlide';

const meta = { ...storyMeta, title: 'Carousel/Transitions' } satisfies Meta<typeof Carousel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Card: Story = {
  parameters: catalogParameters('card'),
  args: {
    mode: 'card',
    infinite: true,
    testID: 'carousel',
    components: { Arrow: MockArrow, Dot: MockDot },
    slots: { arrows: 'below' },
    style: { maxWidth: 420, alignSelf: 'center' },
    arrowsStyle: { marginTop: 12, marginBottom: 12 },
    children: [
      <View
        key="summary"
        style={{ height: 280, padding: 32, backgroundColor: palette.slideBg, borderRadius: 16 }}
      >
        <Text style={{ fontSize: 24, color: palette.ink }}>Monthly overview</Text>
        <Text style={{ fontSize: 40, color: palette.accent, marginTop: 24 }}>$12,480</Text>
        <Text style={{ color: palette.caption, marginTop: 16 }}>Swipe left to see the chart</Text>
      </View>,
      <View
        key="chart"
        style={{ height: 280, padding: 32, backgroundColor: palette.slideBg, borderRadius: 16 }}
      >
        <Text style={{ fontSize: 24, color: palette.ink }}>Revenue by month</Text>
        <View
          accessibilityLabel="Revenue: January 40, February 65, March 85, April 55"
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-around',
            height: 160,
            marginTop: 16,
          }}
        >
          {[40, 65, 85, 55].map((amount, index) => (
            <View key={amount} style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 36,
                  height: amount * 1.4,
                  backgroundColor: palette.accent,
                  borderRadius: 4,
                }}
              />
              <Text style={{ color: palette.caption, marginTop: 8 }}>
                {['Jan', 'Feb', 'Mar', 'Apr'][index]}
              </Text>
            </View>
          ))}
        </View>
      </View>,
      <View
        key="outlook"
        style={{ height: 280, padding: 32, backgroundColor: palette.slideBg, borderRadius: 16 }}
      >
        <Text style={{ fontSize: 24, color: palette.ink }}>Next month</Text>
        <Text style={{ fontSize: 40, color: palette.accent, marginTop: 24 }}>+18%</Text>
        <Text style={{ color: palette.caption, marginTop: 16 }}>
          Keep swiping to return to the overview
        </Text>
      </View>,
    ],
  },
};

const transitionArgs = {
  testID: 'carousel',
  visibleSlides: 1,
  spacing: 16,
  peek: { base: 96, 560: 56, 420: 32 },
  autoPlay: false,
  loop: false,
  infinite: false,
  components: { Arrow: MockArrow, Dot: MockDot },
  slots: { arrows: 'below' as const },
  slideStyle: { paddingVertical: 20 },
  accessibilityLabel: 'Transition comparison',
};

export const Scale: Story = {
  parameters: catalogParameters('scale'),
  argTypes: { peek: { control: 'object' } },
  args: {
    ...transitionArgs,
    children: mockCovers.map((cover, index) => (
      <TransitionSlide key={cover.id} cover={cover} index={index} effect="scale" />
    )),
  },
};

export const Fade: Story = {
  parameters: catalogParameters('fade'),
  argTypes: { peek: { control: 'object' } },
  args: {
    ...transitionArgs,
    children: mockCovers.map((cover, index) => (
      <TransitionSlide key={cover.id} cover={cover} index={index} effect="fade" />
    )),
  },
};

export const Parallax: Story = {
  parameters: catalogParameters('parallax'),
  argTypes: { peek: { control: 'object' } },
  args: {
    ...transitionArgs,
    children: mockCovers.map((cover, index) => (
      <TransitionSlide key={cover.id} cover={cover} index={index} effect="parallax" />
    )),
  },
};
