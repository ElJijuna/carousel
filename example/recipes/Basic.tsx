import { Carousel } from '@real-native/carousel';

import { MockArrow, MockDot, mockSlides } from '../chrome';

/**
 * The smoke test: one slide a page, arrows over the edges, dots underneath.
 *
 * Worth opening first on a new device — if the track drags, snaps and lands on
 * a whole page here, every other recipe is only chrome on top of that.
 */
export const Basic = () => (
  <Carousel
    testID="carousel"
    components={{ Arrow: MockArrow, Dot: MockDot }}
    accessibilityLabel="Basic carousel"
  >
    {mockSlides(4)}
  </Carousel>
);
