import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Carousel } from '../Carousel';
import { useCarousel } from '../CarouselContext';
import type { CarouselHandle, CarouselPaginationSlotProps } from '../types';
import { catalogParameters } from './catalog';
import {
  MockArrow,
  MockCreditCard,
  MockDayAgenda,
  MockDayCell,
  MockDot,
  MockFraction,
  MockPageSlide,
  MockPhotoSlide,
  MockSplitCard,
  MockThumb,
  mockCalendarMonth,
  mockCards,
  mockCoverSlides,
  mockDays,
  mockDefaultDayId,
  mockFeatures,
  mockPages,
  mockPhotos,
} from './mocks';
import { storyMeta } from './storyMeta';
import { styles } from './storyStyles';

const meta = { ...storyMeta, title: 'Carousel/Recipes' } satisfies Meta<typeof Carousel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const CreditCards: Story = {
  parameters: catalogParameters('credit-cards'),
  argTypes: { peek: { control: 'object' } },
  args: {
    testID: 'carousel',
    loop: true,
    spacing: 16,
    peek: { base: 36, 460: 20 },
    components: { Arrow: MockArrow, Dot: MockDot },
  },
  render: (args) => (
    <Carousel
      {...args}
      data={mockCards}
      keyExtractor={(card) => card.id}
      renderItem={({ item }) => <MockCreditCard card={item} />}
      slideLabel={(index, total) => `Card ${index + 1} of ${total}`}
    />
  ),
};

export const SplitCards: Story = {
  parameters: catalogParameters('split-cards'),
  args: {
    testID: 'carousel',
    spacing: 16,
    peek: 28,
    components: { Arrow: MockArrow, Dot: MockDot },
  },
  render: (args) => (
    <Carousel
      {...args}
      data={mockFeatures}
      keyExtractor={(feature) => feature.id}
      renderItem={({ item }) => <MockSplitCard feature={item} />}
    />
  ),
};

const PageFooter = ({
  page,
  pageCount,
  goTo,
  pageLabel,
  accessibilityLabel,
}: CarouselPaginationSlotProps) => {
  // The slot props carry everything about the indicator; the hook is only here
  // for the button, which is not an indicator at all.
  const { next, canGoNext } = useCarousel();
  return (
    <View style={styles.pageFooter}>
      {/* Labelled but role-less, exactly as the carousel labels the dot row it
          draws itself — a `tablist` here would promise tabs it does not have. */}
      <View style={styles.pageDots} accessibilityLabel={accessibilityLabel}>
        {Array.from({ length: pageCount }, (_, index) => (
          <MockDot
            // The page index *is* the identity: a fixed-length row of
            // interchangeable controls, one per page.
            // biome-ignore lint/suspicious/noArrayIndexKey: index is the identity
            key={`page-dot-${index}`}
            index={index}
            total={pageCount}
            selected={index === page}
            onPress={() => goTo(index)}
            accessibilityLabel={pageLabel(index, pageCount)}
          />
        ))}
      </View>
      {/*
        The last page restarts the tour rather than leaving a dead button: a
        story should not ship a control that does nothing.
      */}
      <Pressable
        testID="next-page"
        accessibilityRole="button"
        style={styles.primaryButton}
        onPress={() => (canGoNext ? next() : goTo(0))}
      >
        <Text style={styles.primaryButtonText}>{canGoNext ? 'Next page' : 'Start over'}</Text>
      </Pressable>
    </View>
  );
};

export const PageLayout: Story = {
  parameters: catalogParameters('page-layout'),
  args: {
    testID: 'carousel',
    components: { Pagination: PageFooter },
    slots: { pagination: 'below' },
    accessibilityLabel: 'Onboarding',
    paginationLabel: 'Onboarding steps',
    pageLabel: (index: number, total: number) => `Step ${index + 1} of ${total}`,
    style: styles.pageCarousel,
  },
  render: (args) => (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Your next chapter</Text>
      </View>
      <Carousel
        {...args}
        data={mockPages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MockPageSlide page={item} />}
      />
    </View>
  ),
};

const StripHeader = ({ page, accessibilityLabel }: CarouselPaginationSlotProps) => {
  // `visibleSlides` comes from the hook because it is resolved state, not a
  // prop: the story passes a responsive map, and only the carousel knows which
  // entry of it the container's width just selected.
  const { visibleSlides, next, previous, canGoPrevious, canGoNext } = useCarousel();
  const shown = mockDays.slice(page * visibleSlides, page * visibleSlides + visibleSlides);
  const numbers = shown.map((day) => day.dayOfMonth);
  const readout = numbers.length === 0 ? '' : `${Math.min(...numbers)} – ${Math.max(...numbers)}`;
  return (
    <View style={styles.stripHeader} accessibilityLabel={accessibilityLabel}>
      <Text style={styles.stripTitle}>{mockCalendarMonth}</Text>
      <View style={styles.stripControls}>
        <Text testID="strip-readout" style={styles.stripReadout}>
          {readout}
        </Text>
        <Pressable
          testID="strip-previous"
          accessibilityRole="button"
          accessibilityLabel="Earlier days"
          accessibilityState={{ disabled: !canGoPrevious }}
          onPress={canGoPrevious ? () => previous() : undefined}
          style={[styles.stripButton, !canGoPrevious && styles.dimmed]}
        >
          <Text style={styles.stripButtonGlyph}>‹</Text>
        </Pressable>
        <Pressable
          testID="strip-next"
          accessibilityRole="button"
          accessibilityLabel="Later days"
          accessibilityState={{ disabled: !canGoNext }}
          onPress={canGoNext ? () => next() : undefined}
          style={[styles.stripButton, !canGoNext && styles.dimmed]}
        >
          <Text style={styles.stripButtonGlyph}>›</Text>
        </Pressable>
      </View>
    </View>
  );
};

export const DayCalendar: Story = {
  parameters: catalogParameters('day-calendar'),
  // A week is seven chips on a wide container and fewer on a phone, so this
  // story passes a map and needs the JSON editor back.
  argTypes: { visibleSlides: { control: 'object' } },
  args: {
    testID: 'carousel',
    visibleSlides: { base: 7, 620: 5, 460: 4 },
    spacing: 8,
    components: { Pagination: StripHeader },
    slots: { pagination: 'above' },
    accessibilityLabel: 'Day picker',
    paginationLabel: 'Days shown',
    // Each chip already says which day it is, so the slide wrapper only has to
    // say where in the strip it sits.
    slideLabel: (index: number, total: number) => `Day ${index + 1} of ${total}`,
  },
  render: function Demo(args) {
    // The day's id, not its position: what is selected is a day, and it stays
    // that day however the strip is paged, resized or re-grouped.
    const [selectedId, setSelectedId] = useState(mockDefaultDayId);
    const selectedDay = mockDays.find((day) => day.id === selectedId);
    return (
      <View style={styles.calendar}>
        <Carousel {...args}>
          {mockDays.map((day) => (
            <MockDayCell
              key={day.id}
              day={day}
              selected={day.id === selectedId}
              onPress={() => setSelectedId(day.id)}
            />
          ))}
        </Carousel>
        {selectedDay ? <MockDayAgenda day={selectedDay} /> : null}
      </View>
    );
  },
};

export const Coverflow: Story = {
  parameters: catalogParameters('coverflow'),
  argTypes: { peek: { control: 'object' } },
  args: {
    testID: 'carousel',
    visibleSlides: 1,
    spacing: 16,
    peek: { base: 96, 560: 56, 420: 32 },
    // `infinite` rather than `loop`: a deck with a gap on one side has no card
    // to scale down there, so the effect only reads at the ends if the clones
    // fill them. Album art is static, which is exactly the case the `infinite`
    // warning about cloned slides does not apply to.
    infinite: true,
    components: { Arrow: MockArrow, Dot: MockDot },
    // The peeking neighbours are the subject here, and overlaid arrows sit
    // exactly on top of them — so the controls go under the deck instead.
    slots: { arrows: 'below' },
    // Room for the card's shadow, inside the track. A horizontal scroller
    // cannot clip one axis and leave the other overflowing — the browser
    // forces both — so the track cuts anything drawn outside a slide's box,
    // and a shadow is drawn outside it. The room has to come from within.
    slideStyle: { paddingVertical: 20 },
    accessibilityLabel: 'Albums',
    slideLabel: (index: number, total: number) => `Album ${index + 1} of ${total}`,
    children: mockCoverSlides(),
  },
};

export const Gallery: Story = {
  parameters: catalogParameters('gallery'),
  args: {
    testID: 'carousel',
    components: { Arrow: MockArrow, Pagination: MockFraction },
    accessibilityLabel: 'Photos',
    slideLabel: (index: number, total: number) => `Photo ${index + 1} of ${total}`,
  },
  argTypes: { page: { control: false } },
  render: function GalleryDemo({ onPageChanged, ...args }) {
    const [selected, setSelected] = useState(0);
    const strip = useRef<CarouselHandle>(null);

    // Keep the highlighted thumbnail on screen. `goToSlide` is a no-op when it
    // is already on the current page, so this costs nothing on the changes
    // that do not need it.
    useEffect(() => {
      strip.current?.goToSlide(selected);
    }, [selected]);

    return (
      <View>
        <Carousel
          {...args}
          page={selected}
          onPageChanged={(page, event) => {
            setSelected(page);
            // The story owns the page, but the Actions panel should still see
            // every change — this story's whole subject is that they agree.
            onPageChanged?.(page, event);
          }}
        >
          {mockPhotos.map((photo) => (
            <MockPhotoSlide key={photo.id} photo={photo} />
          ))}
        </Carousel>
        <Carousel
          ref={strip}
          testID="thumbs"
          style={styles.strip}
          visibleSlides={{ base: 5, 560: 4, 420: 3 }}
          spacing={8}
          accessibilityLabel="Thumbnails"
          slideLabel={(index: number, total: number) => `Thumbnail ${index + 1} of ${total}`}
        >
          {mockPhotos.map((photo, index) => (
            <MockThumb
              key={photo.id}
              photo={photo}
              index={index}
              total={mockPhotos.length}
              selected={index === selected}
              onPress={() => setSelected(index)}
            />
          ))}
        </Carousel>
      </View>
    );
  },
};
