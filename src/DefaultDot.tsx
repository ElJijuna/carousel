import type { StyleProp, ViewStyle } from 'react-native';
import { Animated, Platform, Pressable, type PressableProps, StyleSheet, View } from 'react-native';

import type { CarouselDotSlotProps } from './types';

/** Slot props plus styles for the optional built-in page indicator. */
export interface DefaultDotProps extends CarouselDotSlotProps {
  /** Fill the selected indicator from the autoplay clock. @default true */
  showAutoPlayProgress?: boolean;
  /** Style for the autoplay fill. Its width is owned by the clock. */
  progressStyle?: StyleProp<ViewStyle>;
  /** Style for the visual indicator, separate from its press target. */
  style?: StyleProp<ViewStyle>;
  /** Applied after style when this page is selected. */
  selectedStyle?: StyleProp<ViewStyle>;
  /** Style for the press target; defaults to a 44 × 44 dp minimum. */
  containerStyle?: StyleProp<ViewStyle>;
  /** Extra press area around the target. Defaults to 8 dp. */
  hitSlop?: PressableProps['hitSlop'];
  /** Test identifier for the press target. */
  testID?: string;
}

const INACTIVE_COLOR = '#94a3b8';
const ACTIVE_COLOR = '#2563eb';
const styles = StyleSheet.create({
  target: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  indicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: INACTIVE_COLOR },
  selected: { backgroundColor: ACTIVE_COLOR },
  progressTrack: { width: 32, overflow: 'hidden', backgroundColor: INACTIVE_COLOR },
  progressFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: ACTIVE_COLOR },
});

/**
 * An optional Dot slot with button semantics, selected state and a press target.
 * Restyle the indicator into a dot or a line without reimplementing interaction.
 */
export function DefaultDot({
  selected,
  autoPlayState,
  showAutoPlayProgress = true,
  progressStyle,
  onPress,
  accessibilityLabel,
  style,
  selectedStyle,
  containerStyle,
  hitSlop = 8,
  testID,
}: DefaultDotProps) {
  // aria-current is valid for a page button on web; selected state is native.
  const webState: { 'aria-current'?: 'page' } =
    Platform.OS === 'web' && selected ? { 'aria-current': 'page' } : {};
  const showProgress =
    selected && showAutoPlayProgress && autoPlayState?.enabled && autoPlayState.duration > 0;
  return (
    <Pressable
      {...webState}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={Platform.OS === 'web' ? undefined : { selected }}
      hitSlop={hitSlop}
      onPress={onPress}
      style={[styles.target, containerStyle]}
    >
      <View
        accessible={false}
        {...(Platform.OS === 'web' ? { 'aria-hidden': true } : {})}
        style={[
          styles.indicator,
          selected ? styles.selected : null,
          showProgress ? styles.progressTrack : null,
          style,
          selected ? selectedStyle : null,
        ]}
      >
        {showProgress && autoPlayState ? (
          <Animated.View
            accessible={false}
            pointerEvents="none"
            testID={testID === undefined ? undefined : `${testID}-progress`}
            style={[
              styles.progressFill,
              progressStyle,
              {
                width: autoPlayState.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                  extrapolate: 'clamp',
                }),
              },
            ]}
          />
        ) : null}
      </View>
    </Pressable>
  );
}
