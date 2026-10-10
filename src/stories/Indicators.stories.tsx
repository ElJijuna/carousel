import type { Meta, StoryObj } from '@storybook/react';
import { Pressable, Text, View } from 'react-native';
import { Carousel } from '../Carousel';
import { useCarousel } from '../CarouselContext';
import { DefaultDot } from '../DefaultDot';
import type { CarouselDotSlotProps } from '../types';
import { catalogParameters } from './catalog';
import { MockArrow, MockDot, MockFraction, MockSlide, mockSlides, palette } from './mocks';
import { storyMeta } from './storyMeta';
import { styles } from './storyStyles';

const meta = { ...storyMeta, title: 'Carousel/Indicators' } satisfies Meta<typeof Carousel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const FractionPagination: Story = {
  parameters: catalogParameters('fraction-pagination'),
  args: {
    testID: 'carousel',
    components: { Arrow: MockArrow, Pagination: MockFraction },
    children: mockSlides(8),
  },
};

const ProgressBar = () => {
  const { page, pageCount, next, previous, canGoPrevious, canGoNext } = useCarousel();
  return (
    <View>
      <View testID="progress-track" style={styles.progressTrack}>
        <View
          testID="progress-fill"
          style={[styles.progressFill, { width: `${((page + 1) / pageCount) * 100}%` }]}
        />
      </View>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          testID="hook-previous"
          style={[styles.button, !canGoPrevious && styles.dimmed]}
          onPress={() => previous()}
        >
          <Text style={styles.buttonText}>Back</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          testID="hook-next"
          style={[styles.button, !canGoNext && styles.dimmed]}
          onPress={() => next()}
        >
          <Text style={styles.buttonText}>Forward</Text>
        </Pressable>
      </View>
    </View>
  );
};

export const CustomChromeViaHook: Story = {
  parameters: catalogParameters('custom-chrome-via-hook'),
  args: {
    testID: 'carousel',
    components: { Pagination: ProgressBar },
    slots: { pagination: 'below' },
    children: mockSlides(5),
  },
};

export const OverlayPagination: Story = {
  parameters: catalogParameters('overlay-pagination'),
  args: {
    testID: 'carousel',
    style: { height: 300 },
    slots: { pagination: 'overlay' },
    paginationPlacement: 'top',
    paginationInset: { top: 44, bottom: 34, left: 10, right: 20 },
    components: { Dot: MockDot },
    children: [0, 1, 2].map((index) => (
      <MockSlide key={index} index={index} style={{ height: 300 }} />
    )),
  },
};

const LineIndicator = (props: CarouselDotSlotProps) => (
  <DefaultDot
    {...props}
    style={{ width: 24, height: 3, borderRadius: 2 }}
    selectedStyle={{ width: 36, backgroundColor: palette.accent }}
  />
);

export const DefaultIndicators: Story = {
  parameters: catalogParameters('default-indicators'),
  args: { testID: 'carousel', components: { Dot: DefaultDot }, children: mockSlides(3) },
  render: (args) => (
    <View>
      <Carousel {...args} />
      <Carousel {...args} testID="lines" components={{ Dot: LineIndicator }} />
    </View>
  ),
};
