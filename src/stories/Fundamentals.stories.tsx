import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { Carousel } from '../Carousel';
import { catalogParameters } from './catalog';
import {
  MockArrow,
  MockDot,
  MockFraction,
  MockSlide,
  mockData,
  mockSlides,
  palette,
} from './mocks';
import { storyMeta } from './storyMeta';

const meta = { ...storyMeta, title: 'Carousel/Fundamentals' } satisfies Meta<typeof Carousel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  parameters: catalogParameters('basic'),
  args: {
    testID: 'carousel',
    components: { Dot: MockDot },
    children: mockSlides(4),
  },
};

export const NoChrome: Story = {
  parameters: catalogParameters('no-chrome'),
  args: {
    testID: 'carousel',
    children: mockSlides(4),
  },
};

export const WithArrows: Story = {
  parameters: catalogParameters('with-arrows'),
  args: {
    testID: 'carousel',
    components: { Arrow: MockArrow, Dot: MockDot },
    children: mockSlides(4),
  },
};

export const VisibleSlides: Story = {
  parameters: catalogParameters('visible-slides'),
  args: {
    testID: 'carousel',
    visibleSlides: 3,
    spacing: 12,
    components: { Arrow: MockArrow, Dot: MockDot },
    children: mockSlides(6),
  },
};

export const PeekAndSpacing: Story = {
  parameters: catalogParameters('peek-and-spacing'),
  args: {
    testID: 'carousel',
    visibleSlides: 2,
    spacing: 12,
    peek: 32,
    components: { Arrow: MockArrow, Dot: MockDot },
    children: mockSlides(7),
  },
};

export const Responsive: Story = {
  parameters: catalogParameters('responsive'),
  // This story is the one that passes maps rather than numbers, so it swaps the
  // meta's number controls back for the JSON editor that can express one.
  argTypes: {
    visibleSlides: { control: 'object' },
    peek: { control: 'object' },
  },
  args: {
    testID: 'carousel',
    visibleSlides: { base: 3, 700: 2, 460: 1 },
    peek: { base: 32, 460: 16 },
    spacing: 12,
    components: { Arrow: MockArrow, Dot: MockDot },
    children: mockSlides(9),
  },
};

const virtualizedData = mockData(500);

export const Virtualized: Story = {
  parameters: catalogParameters('virtualized'),
  args: {
    testID: 'carousel',
    visibleSlides: 2,
    spacing: 12,
    components: { Arrow: MockArrow, Pagination: MockFraction },
  },
  render: (args) => (
    <Carousel
      {...args}
      data={virtualizedData}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <MockSlide index={item.index} caption="virtualized" />}
    />
  ),
};

export const FillHeight: Story = {
  parameters: catalogParameters('fill-height'),
  args: { slideHeight: 'fill', components: { Dot: MockDot } },
  render: (args) => (
    <View>
      <View style={{ height: 300 }}>
        <Carousel {...args} testID="fill-children" style={{ flex: 1 }}>
          <View testID="fill-child" style={{ flex: 1, backgroundColor: palette.accent }} />
          <View style={{ flex: 1, backgroundColor: palette.ink }} />
        </Carousel>
      </View>
      <View style={{ height: 300 }}>
        <Carousel
          {...args}
          testID="fill-data"
          style={{ flex: 1 }}
          data={[palette.accent, palette.ink]}
          renderItem={({ item, index }) => (
            <View testID={`fill-item-${index}`} style={{ flex: 1, backgroundColor: item }} />
          )}
        />
      </View>
    </View>
  ),
};
