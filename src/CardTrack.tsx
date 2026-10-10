import { type ReactNode, useState } from 'react';
import { Animated, Platform, StyleSheet, View, type ViewProps } from 'react-native';

import type { CardTransition } from './hooks/useCardTransition';

const styles = StyleSheet.create({
  track: { position: 'relative', flexGrow: 1, flexShrink: 1 },
  face: { backfaceVisibility: 'hidden' },
  back: { position: 'absolute', top: 0, left: 0, right: 0 },
  fill: { flex: 1 },
  fillBack: { bottom: 0 },
});

interface CardTrackProps {
  transition: CardTransition;
  renderSlide: (index: number) => ReactNode;
  slideCount: number;
  slideLabel: (index: number, total: number) => string;
  fill: boolean;
  style: ViewProps['style'];
  slideStyle: ViewProps['style'];
  testID?: string;
  keyboardProps: object;
  rtl: boolean;
  slideKey: (index: number) => string;
}

/** Two independently transformed faces avoid flattened 3D children on web. */
export function CardTrack({
  transition,
  renderSlide,
  slideCount,
  slideLabel,
  fill,
  style,
  slideStyle,
  testID,
  keyboardProps,
  rtl,
  slideKey,
}: CardTrackProps) {
  const { faces, angle, backVisible, panHandlers } = transition;
  const [height, setHeight] = useState(0);
  const rotation = angle.interpolate({
    inputRange: [-1, 1],
    outputRange: rtl ? ['180deg', '-180deg'] : ['-180deg', '180deg'],
  });
  const backRotation = angle.interpolate({
    inputRange: [-1, 1],
    outputRange: rtl ? ['360deg', '0deg'] : ['0deg', '360deg'],
  });
  return (
    <View
      {...panHandlers}
      {...keyboardProps}
      testID={testID}
      style={[
        styles.track,
        !fill && height > 0 ? { minHeight: height } : null,
        Platform.OS === 'web' ? ({ touchAction: 'pan-y' } as ViewProps['style']) : null,
        style,
      ]}
    >
      {[faces.front, faces.back].map((index, side) => {
        if (index === null || index >= slideCount) {
          return null;
        }
        const back = side === 1;
        const hidden = back !== backVisible;
        return (
          <Animated.View
            key={slideKey(index)}
            testID={testID === undefined ? undefined : `${testID}-face-${index}`}
            {...(Platform.OS === 'web'
              ? { role: 'group' as const, 'aria-hidden': hidden, inert: hidden }
              : {})}
            accessibilityLabel={hidden ? undefined : slideLabel(index, slideCount)}
            accessibilityElementsHidden={hidden}
            importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
            pointerEvents={hidden ? 'none' : 'auto'}
            onLayout={
              fill
                ? undefined
                : (event) => {
                    const measured = event.nativeEvent.layout.height;
                    setHeight((previous) => Math.max(previous, measured));
                  }
            }
            style={[
              slideStyle,
              styles.face,
              fill ? styles.fill : null,
              back ? styles.back : null,
              back && fill ? styles.fillBack : null,
              { transform: [{ perspective: 1000 }, { rotateY: back ? backRotation : rotation }] },
            ]}
          >
            {renderSlide(index)}
          </Animated.View>
        );
      })}
    </View>
  );
}
