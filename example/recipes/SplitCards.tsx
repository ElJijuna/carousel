import { Carousel } from '@real-native/carousel';

import { MockArrow, MockDot, MockSplitCard, mockFeatures } from '../chrome';

/**
 * Split cards in the virtualized `data` mode: title and copy on the left half,
 * artwork on the right.
 *
 * Each half is exactly half the slide, so the split follows the width the
 * carousel computes rather than a hard-coded one — the layout to check after
 * changing anything about how `peek` and `spacing` divide the track.
 */
export const SplitCards = () => (
  <Carousel
    testID="carousel"
    spacing={16}
    peek={28}
    components={{ Arrow: MockArrow, Dot: MockDot }}
    data={mockFeatures}
    keyExtractor={(feature) => feature.id}
    renderItem={({ item }) => <MockSplitCard feature={item} />}
    accessibilityLabel="Features"
  />
);
