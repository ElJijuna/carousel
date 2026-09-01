import { Carousel, type CarouselPaginationSlotProps, useCarousel } from '@real-native/carousel';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  MockDayAgenda,
  MockDayCell,
  mockCalendarMonth,
  mockDays,
  mockDefaultDayId,
  palette,
} from '../chrome';

const styles = StyleSheet.create({
  calendar: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: palette.calendarBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: { fontSize: 16, fontWeight: '600', color: palette.calendarInk },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  readout: {
    fontSize: 12,
    color: palette.calendarMuted,
    fontVariant: ['tabular-nums'],
    marginRight: 4,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.calendarBorder,
    backgroundColor: palette.calendarCell,
  },
  glyph: { fontSize: 16, lineHeight: 18, color: palette.calendarInk },
  dimmed: { opacity: 0.4 },
});

/**
 * The strip's header: the month on the left, the stepper on the right.
 *
 * It goes in the `Pagination` slot placed `above`, because a day strip's
 * indicator is not a row of dots — it is "which days are these", spelled out
 * next to the controls that change them.
 */
const StripHeader = ({ page, accessibilityLabel }: CarouselPaginationSlotProps) => {
  // `visibleSlides` comes from the hook because it is resolved state, not a
  // prop: this screen passes a responsive map, and only the carousel knows
  // which entry of it the container's width just selected.
  const { visibleSlides, next, previous, canGoPrevious, canGoNext } = useCarousel();
  const shown = mockDays.slice(page * visibleSlides, page * visibleSlides + visibleSlides);
  const numbers = shown.map((day) => day.dayOfMonth);
  const readout = numbers.length === 0 ? '' : `${Math.min(...numbers)} – ${Math.max(...numbers)}`;

  return (
    <View style={styles.header} accessibilityLabel={accessibilityLabel}>
      <Text style={styles.title}>{mockCalendarMonth}</Text>
      <View style={styles.controls}>
        <Text style={styles.readout}>{readout}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Earlier days"
          accessibilityState={{ disabled: !canGoPrevious }}
          onPress={canGoPrevious ? () => previous() : undefined}
          style={[styles.button, !canGoPrevious && styles.dimmed]}
        >
          <Text style={styles.glyph}>‹</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Later days"
          accessibilityState={{ disabled: !canGoNext }}
          onPress={canGoNext ? () => next() : undefined}
          style={[styles.button, !canGoNext && styles.dimmed]}
        >
          <Text style={styles.glyph}>›</Text>
        </Pressable>
      </View>
    </View>
  );
};

/**
 * A day picker: a page of days, and the selected day's agenda below.
 *
 * The two pieces of state are deliberately separate. The **page** is the
 * carousel's — which days are on screen — and the **selection** is this
 * screen's, so paging ahead to look at next week does not change the day you
 * were reading, and picking a day does not scroll the strip out from under
 * your finger.
 *
 * `visibleSlides` is a responsive map, which is what makes this the recipe to
 * rotate the device on: a page is seven days on a tablet and four on a phone
 * held upright, and the selection has to survive the switch untouched.
 */
export const DayCalendar = () => {
  // The day's id, not its position: what is selected is a day, and it stays
  // that day however the strip is paged, resized or re-grouped.
  const [selectedId, setSelectedId] = useState(mockDefaultDayId);
  const selectedDay = mockDays.find((day) => day.id === selectedId);

  return (
    <View style={styles.calendar}>
      <Carousel
        testID="carousel"
        visibleSlides={{ base: 7, 620: 5, 460: 4 }}
        spacing={8}
        components={{ Pagination: StripHeader }}
        slots={{ pagination: 'above' }}
        accessibilityLabel="Day picker"
        paginationLabel="Days shown"
        slideLabel={(index, total) => `Day ${index + 1} of ${total}`}
      >
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
};
