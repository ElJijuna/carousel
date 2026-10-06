import type { StyleProp, ViewStyle } from 'react-native';
import { Platform, Pressable, type PressableProps, StyleSheet, View } from 'react-native';

import type { CarouselDotSlotProps } from './types';

/** Slot props plus styles for the optional built-in page indicator. */
export interface DefaultDotProps extends CarouselDotSlotProps {
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
});

/**
 * An optional Dot slot with button semantics, selected state and a press target.
 * Restyle the indicator into a dot or a line without reimplementing interaction.
 */
export function DefaultDot({
  selected,
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
        style={[styles.indicator, style, selected ? [styles.selected, selectedStyle] : null]}
      />
    </Pressable>
  );
}
