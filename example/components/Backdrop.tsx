import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { theme } from '../theme';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.night },
  fill: StyleSheet.absoluteFill,
  // The glows are circles whose own gradient fades to nothing, which is what
  // makes them read as light rather than as two flat discs: a solid circle at
  // low opacity still shows an edge, and there is no radial gradient in
  // `expo-linear-gradient` to reach for instead.
  glow: { position: 'absolute', borderRadius: 999 },
  glowTop: { width: 420, height: 420, top: -160, left: -120 },
  glowBottom: { width: 360, height: 360, bottom: -140, right: -110 },
  content: { flex: 1 },
});

/**
 * The ground everything else sits on: a dark gradient with two soft glows.
 *
 * The glows are the only reason the glass panels above them look like glass —
 * a blur over a flat colour returns that same flat colour, so without
 * something varying underneath there is nothing for the frost to pick up.
 */
export const Backdrop = ({ children }: { children: ReactNode }) => (
  <View style={styles.root}>
    <LinearGradient
      colors={[theme.night, theme.nightMid, theme.night]}
      locations={[0, 0.45, 1]}
      style={styles.fill}
    />
    <LinearGradient
      colors={[theme.glowIndigo, theme.glowFade]}
      style={[styles.glow, styles.glowTop]}
      pointerEvents="none"
    />
    <LinearGradient
      colors={[theme.glowCyan, theme.glowFade]}
      start={{ x: 1, y: 1 }}
      end={{ x: 0, y: 0 }}
      style={[styles.glow, styles.glowBottom]}
      pointerEvents="none"
    />
    <View style={styles.content}>{children}</View>
  </View>
);
