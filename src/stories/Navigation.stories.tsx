import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Carousel } from '../Carousel';
import type { CarouselHandle } from '../types';
import { catalogParameters } from './catalog';
import { MockArrow, MockDot, mockSlides } from './mocks';
import { storyMeta } from './storyMeta';
import { styles } from './storyStyles';

const meta = { ...storyMeta, title: 'Carousel/Navigation' } satisfies Meta<typeof Carousel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Loop: Story = {
  parameters: catalogParameters('loop'),
  args: {
    testID: 'carousel',
    loop: true,
    components: { Arrow: MockArrow, Dot: MockDot },
    children: mockSlides(4),
  },
};

export const Infinite: Story = {
  parameters: catalogParameters('infinite'),
  args: {
    testID: 'carousel',
    infinite: true,
    visibleSlides: 2,
    spacing: 12,
    peek: 24,
    components: { Arrow: MockArrow, Dot: MockDot },
    children: mockSlides(6),
  },
};

export const Controlled: Story = {
  parameters: catalogParameters('controlled'),
  args: {
    testID: 'carousel',
    components: { Arrow: MockArrow, Dot: MockDot },
  },
  // `page` and `onPageChanged` are the point of the story, so they stay out of
  // the controls; everything else comes from `args`.
  argTypes: { page: { control: false } },
  render: function GalleryDemo({ onPageChanged, ...args }) {
    const [page, setPage] = useState(0);
    return (
      <View>
        <Carousel
          {...args}
          page={page}
          // Overriding the arg would silence the Actions panel for the one
          // story whose whole subject is the page changing, so call both.
          onPageChanged={(next) => {
            setPage(next);
            onPageChanged?.(next);
          }}
        >
          {mockSlides(5)}
        </Carousel>
        <View style={styles.row}>
          <Pressable
            accessibilityRole="button"
            testID="external-first"
            style={styles.button}
            onPress={() => setPage(0)}
          >
            <Text style={styles.buttonText}>First</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            testID="external-last"
            style={styles.button}
            onPress={() => setPage(4)}
          >
            <Text style={styles.buttonText}>Last</Text>
          </Pressable>
        </View>
        <Text testID="page-readout" style={styles.readout}>{`page ${page}`}</Text>
      </View>
    );
  },
};

export const ImperativeHandle: Story = {
  parameters: catalogParameters('imperative-handle'),
  args: {
    testID: 'carousel',
    loop: true,
    components: { Dot: MockDot },
  },
  render: function Demo(args) {
    const carousel = useRef<CarouselHandle>(null);
    const [readout, setReadout] = useState('page 0');
    const sync = () => setReadout(`page ${carousel.current?.page ?? 0}`);
    return (
      <View>
        <Carousel {...args} ref={carousel}>
          {mockSlides(6)}
        </Carousel>
        <View style={styles.row}>
          <Pressable
            accessibilityRole="button"
            testID="handle-previous"
            style={styles.button}
            onPress={() => {
              carousel.current?.previous();
              sync();
            }}
          >
            <Text style={styles.buttonText}>Previous</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            testID="handle-slide"
            style={styles.button}
            onPress={() => {
              carousel.current?.goToSlide(4);
              sync();
            }}
          >
            <Text style={styles.buttonText}>Slide 5</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            testID="handle-next"
            style={styles.button}
            onPress={() => {
              carousel.current?.next();
              sync();
            }}
          >
            <Text style={styles.buttonText}>Next</Text>
          </Pressable>
        </View>
        <Text testID="handle-readout" style={styles.readout}>
          {readout}
        </Text>
      </View>
    );
  },
};
