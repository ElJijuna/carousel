import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState } from 'react';
import { Animated, Platform, Pressable, Text, View } from 'react-native';
import type { Carousel } from '../Carousel';
import { useCarousel } from '../CarouselContext';
import { DefaultDot } from '../DefaultDot';
import type { CarouselDotSlotProps, CarouselPaginationSlotProps } from '../types';
import { catalogParameters } from './catalog';
import { MockDot, MockPlayPause, mockSlides, palette } from './mocks';
import { storyMeta } from './storyMeta';
import { styles } from './storyStyles';

const meta = { ...storyMeta, title: 'Carousel/Autoplay' } satisfies Meta<typeof Carousel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const AutoPlay: Story = {
  parameters: catalogParameters('auto-play'),
  args: {
    testID: 'carousel',
    autoPlay: true,
    interval: 2000,
    loop: true,
    components: { Dot: MockDot, PlayPauseControl: MockPlayPause },
    children: mockSlides(4),
  },
};

const AutoPlayDefaultDot = (props: CarouselDotSlotProps) => (
  <DefaultDot {...props} testID={`autoplay-dot-${props.index}`} />
);

const AutoPlayCustomDot = ({
  selected,
  autoPlayState,
  onPress,
  accessibilityLabel,
  index,
}: CarouselDotSlotProps) => (
  <Pressable
    testID={`autoplay-dot-${index}`}
    {...(Platform.OS === 'web' && selected ? { 'aria-current': 'page' as const } : {})}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    accessibilityState={Platform.OS === 'web' ? undefined : { selected }}
    onPress={onPress}
    style={{ minHeight: 44, minWidth: 64, justifyContent: 'center', padding: 8 }}
  >
    <View
      style={{
        height: 6,
        width: 48,
        borderRadius: 3,
        overflow: 'hidden',
        backgroundColor: palette.track,
      }}
    >
      <Animated.View
        testID={`autoplay-dot-${index}-progress`}
        style={{
          height: '100%',
          backgroundColor: palette.accent,
          width:
            selected && autoPlayState?.enabled
              ? autoPlayState.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                })
              : 0,
        }}
      />
    </View>
  </Pressable>
);

function AutoPlayClockReadout() {
  const { autoPlayState } = useCarousel();
  const { progress, duration, isPlaying } = autoPlayState;
  const [percent, setPercent] = useState(0);
  useEffect(() => {
    const id = progress.addListener(({ value }) => setPercent(Math.round(value * 100)));
    return () => progress.removeListener(id);
  }, [progress]);
  return (
    <Text
      testID="autoplay-clock"
      style={styles.readout}
    >{`${percent}% · ${duration}ms · ${isPlaying ? 'running' : 'paused'}`}</Text>
  );
}

function AutoPlayProgressPagination({
  page,
  pageCount,
  goTo,
  pageLabel,
  autoPlayState,
}: CarouselPaginationSlotProps) {
  return (
    <View>
      <View style={styles.row}>
        {Array.from({ length: pageCount }, (_, index) => (
          <AutoPlayCustomDot
            // biome-ignore lint/suspicious/noArrayIndexKey: the page index is the identity of an indicator
            key={`page-${index}`}
            index={index}
            total={pageCount}
            selected={index === page}
            onPress={() => goTo(index)}
            accessibilityLabel={pageLabel(index, pageCount)}
            autoPlayState={autoPlayState}
          />
        ))}
      </View>
      <AutoPlayClockReadout />
    </View>
  );
}

export const AutoPlayProgress: Story = {
  parameters: catalogParameters('auto-play-progress'),
  args: {
    testID: 'carousel',
    autoPlay: true,
    interval: 3000,
    infinite: true,
    components: { Dot: AutoPlayDefaultDot, PlayPauseControl: MockPlayPause },
    slots: { playPause: 'below' },
    children: mockSlides(3),
  },
};

export const CustomAutoPlayProgress: Story = {
  parameters: catalogParameters('custom-auto-play-progress'),
  args: {
    ...AutoPlayProgress.args,
    components: { Pagination: AutoPlayProgressPagination, PlayPauseControl: MockPlayPause },
  },
};
