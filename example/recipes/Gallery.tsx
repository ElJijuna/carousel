import { Carousel, type CarouselHandle } from '@real-native/carousel';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { MockArrow, MockFraction, MockPhotoSlide, MockThumb, mockPhotos } from '../chrome';

const styles = StyleSheet.create({
  strip: { marginTop: 12 },
});

/**
 * A gallery: the picture on top, a strip of thumbnails under it.
 *
 * One piece of state — the selected photo — and both carousels answer to it.
 * The picture is *controlled*, so it only ever renders the index this screen
 * holds; the strip is left uncontrolled and nudged through its `ref`, because
 * what it needs is not to sit on a particular page but to keep the selected
 * thumbnail in view.
 *
 * On a device this is the recipe that shows whether `goToSlide` keeps up with
 * a fling: swipe the picture hard across several photos and watch the strip
 * arrive on the right one rather than on the one the finger passed over.
 */
export const Gallery = () => {
  const [selected, setSelected] = useState(0);
  const strip = useRef<CarouselHandle>(null);

  // Keep the highlighted thumbnail on screen. `goToSlide` is a no-op when it is
  // already on the current page, so this costs nothing on the changes that do
  // not need it.
  useEffect(() => {
    strip.current?.goToSlide(selected);
  }, [selected]);

  return (
    <View>
      <Carousel
        testID="carousel"
        page={selected}
        onPageChanged={setSelected}
        components={{ Arrow: MockArrow, Pagination: MockFraction }}
        accessibilityLabel="Photos"
        slideLabel={(index, total) => `Photo ${index + 1} of ${total}`}
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
        slideLabel={(index, total) => `Thumbnail ${index + 1} of ${total}`}
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
};
