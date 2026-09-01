import { Carousel, type CarouselPaginationSlotProps, useCarousel } from '@real-native/carousel';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MockDot, MockPageSlide, mockPages, palette } from '../chrome';

const styles = StyleSheet.create({
  // The carousel fills the space the footer leaves, and the track fills what is
  // left inside that — no fixed heights anywhere in this screen.
  carousel: { flex: 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 12,
    paddingRight: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: palette.track,
  },
  dots: { flexDirection: 'row', alignItems: 'center' },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: palette.accent,
  },
  buttonText: { color: palette.surface, fontSize: 14, fontWeight: '600' },
});

/**
 * The screen's bottom bar: the page dots on the left, the primary action on
 * the right.
 *
 * It goes in the `Pagination` slot — the one that replaces the whole indicator
 * row — because that is what lets the dots and the button be one bar instead
 * of two stacked ones.
 */
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
    <View style={styles.footer}>
      <View style={styles.dots} accessibilityLabel={accessibilityLabel}>
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
      <Pressable
        accessibilityRole="button"
        style={styles.button}
        onPress={() => (canGoNext ? next() : goTo(0))}
      >
        <Text style={styles.buttonText}>{canGoNext ? 'Next page' : 'Start over'}</Text>
      </Pressable>
    </View>
  );
};

/**
 * The carousel as the screen itself, with the dots and the primary button in
 * one bar at the bottom.
 *
 * This is the recipe that only a device really answers: the carousel is sized
 * by `flex`, so it is the safe area, the keyboard and the navigation bar that
 * decide how tall it ends up — none of which a browser viewport reproduces.
 */
export const PageLayout = () => (
  <Carousel
    testID="carousel"
    style={styles.carousel}
    components={{ Pagination: PageFooter }}
    slots={{ pagination: 'below' }}
    accessibilityLabel="Onboarding"
    paginationLabel="Onboarding steps"
    pageLabel={(index, total) => `Step ${index + 1} of ${total}`}
    data={mockPages}
    keyExtractor={(item) => item.id}
    renderItem={({ item }) => <MockPageSlide page={item} />}
  />
);
