import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native';

import { theme } from '../theme';

const styles = StyleSheet.create({
  glass: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.glassEdge,
    backgroundColor: theme.glass,
    // The blur is drawn edge to edge, so the radius only reads if what is
    // inside is clipped to it as well.
    overflow: 'hidden',
  },
});

/**
 * A frosted panel.
 *
 * `intensity` is the blur radius, not an opacity — the fill underneath is
 * `theme.glass` either way. That matters because the blur is the part that can
 * go missing: `expo-blur` defaults to `blurMethod: 'none'` on Android and
 * falls back to a plain translucent view, which is why the fill and the
 * hairline edge have to carry the panel on their own.
 */
export const Glass = ({
  children,
  style,
  intensity = 32,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
}) => (
  <BlurView
    intensity={intensity}
    tint="dark"
    blurMethod="dimezisBlurViewSdk31Plus"
    style={[styles.glass, style]}
  >
    {children}
  </BlurView>
);
