import { Carousel } from '@real-native/carousel';

import { MockDot, MockPlayPause, mockSlides } from '../chrome';

/**
 * Rotates on a timer, with the stop control WCAG 2.2.2 requires.
 *
 * The rotation pauses while you drag and while the app is backgrounded — the
 * second half of which only a real device can show you. Send the app to the
 * home screen and come back: the timer should not have advanced past a
 * cliff of slides in the meantime.
 */
export const AutoPlay = () => (
  <Carousel
    testID="carousel"
    autoPlay
    interval={2000}
    loop
    components={{ Dot: MockDot, PlayPauseControl: MockPlayPause }}
    accessibilityLabel="Rotating banners"
  >
    {mockSlides(4)}
  </Carousel>
);
