import { Carousel } from '@real-native/carousel';
import { StyleSheet } from 'react-native';

import { MockArrow, MockDot, mockCoverSlides } from '../chrome';

const styles = StyleSheet.create({
  // Room for each card's shadow, inside the track. A horizontal scroller cannot
  // clip one axis and leave the other overflowing, so the track cuts anything
  // drawn outside a slide's box — and a shadow is drawn outside it.
  slide: { paddingVertical: 20 },
});

/**
 * A coverflow: the card in front is full size, its neighbours shrink and fade
 * back, and all of it is arithmetic on one number.
 *
 * Each slide reads its own `progress` through `useCarouselSlide` and turns it
 * into a scale and an opacity — no animation library involved. The value
 * updates on every scroll frame, so this is the recipe to judge on a device
 * rather than in a browser: half-swipe and hold, and the deck should track the
 * finger continuously instead of snapping between two states.
 */
export const Coverflow = () => (
  <Carousel
    testID="carousel"
    visibleSlides={1}
    spacing={16}
    peek={{ base: 96, 560: 56, 420: 32 }}
    // `infinite` rather than `loop`: a deck with a gap on one side has no card
    // to scale down there, so the effect only reads at the ends if the clones
    // fill them. Album art is static, which is exactly the case the `infinite`
    // warning about cloned slides does not apply to.
    infinite
    components={{ Arrow: MockArrow, Dot: MockDot }}
    // The peeking neighbours are the subject here, and overlaid arrows sit
    // right on top of them — so the controls go under the deck instead.
    slots={{ arrows: 'below' }}
    slideStyle={styles.slide}
    accessibilityLabel="Albums"
    slideLabel={(index, total) => `Album ${index + 1} of ${total}`}
  >
    {mockCoverSlides()}
  </Carousel>
);
