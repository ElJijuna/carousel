import { Carousel } from '@real-native/carousel';

import { MockArrow, MockCreditCard, MockDot, mockCards } from '../chrome';

/**
 * A wallet: cards that wrap, with the neighbours peeking in at both edges.
 *
 * `loop` rewinds rather than cloning, so stepping forward off the last card
 * scrolls back to the first. On a device that rewind is a visible animation
 * across the whole deck — this is the recipe that shows whether you want it,
 * or whether `infinite` (as in the coverflow) is the wrap you actually meant.
 */
export const CreditCards = () => (
  <Carousel
    testID="carousel"
    loop
    spacing={16}
    peek={{ base: 36, 460: 20 }}
    components={{ Arrow: MockArrow, Dot: MockDot }}
    data={mockCards}
    keyExtractor={(card) => card.id}
    renderItem={({ item }) => <MockCreditCard card={item} />}
    accessibilityLabel="Cards"
    slideLabel={(index, total) => `Card ${index + 1} of ${total}`}
  />
);
