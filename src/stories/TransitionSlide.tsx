import { useState } from 'react';
import { I18nManager, Image, StyleSheet, Text, View } from 'react-native';
import { useCarouselSlide } from '../CarouselSlideContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { mockImageLabels, mockImages } from './mockImages';
import { type MockCover, palette } from './mocks';

type TransitionEffect = 'scale' | 'fade' | 'parallax';

const styles = StyleSheet.create({
  card: { borderRadius: 16, overflow: 'hidden', backgroundColor: palette.surface },
  viewport: { height: 260, overflow: 'hidden' },
  artwork: { position: 'absolute', top: 0, bottom: 0 },
  image: { width: '100%', height: '100%' },
  ring: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 12,
    borderColor: palette.surface,
    top: 48,
    left: '25%',
  },
  number: { position: 'absolute', bottom: 16, left: 24, color: palette.surface, fontSize: 40 },
  body: { padding: 16 },
  title: { color: palette.ink, fontSize: 18, fontWeight: '600' },
  artist: { color: palette.caption, fontSize: 14, marginTop: 4 },
});

/** Story-only effects: transform the content, leaving the slide's layout intact. */
export function TransitionSlide({
  cover,
  index,
  effect,
}: {
  cover: MockCover;
  index: number;
  effect: TransitionEffect;
}) {
  const { progress } = useCarouselSlide(index);
  const reducedMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const distance = reducedMotion ? 0 : Math.min(Math.abs(progress), 1);
  // Progress grows when the track travels forwards. Mirror the counter-motion
  // on RTL, just as the carousel mirrors its physical scroll offsets.
  const shift = reducedMotion ? 0 : progress * width * 0.12 * (I18nManager.isRTL ? -1 : 1);
  return (
    <View
      testID={`transition-${cover.id}`}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={[
        styles.card,
        {
          opacity: effect === 'fade' ? 1 - distance * 0.65 : 1,
          transform: [{ scale: effect === 'scale' ? 1 - distance * 0.1 : 1 }],
        },
      ]}
    >
      <View style={styles.viewport} testID={`transition-${cover.id}-viewport`}>
        <View
          testID={`transition-${cover.id}-artwork`}
          style={[
            styles.artwork,
            {
              // Overscan by the maximum translation on both sides, so even
              // a full-page movement cannot expose an empty edge.
              left: effect === 'parallax' ? -width * 0.12 : 0,
              right: effect === 'parallax' ? -width * 0.12 : 0,
              transform: [{ translateX: effect === 'parallax' ? shift : 0 }],
            },
          ]}
        >
          <Image
            style={styles.image}
            resizeMode="cover"
            source={{ uri: mockImages[cover.image] }}
            accessibilityLabel={mockImageLabels[cover.image]}
          />
          <View style={styles.ring} />
          <Text style={styles.number} accessible={false}>
            {String(index + 1).padStart(2, '0')}
          </Text>
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{cover.title}</Text>
        <Text style={styles.artist}>{cover.artist}</Text>
      </View>
    </View>
  );
}
