import { StyleSheet } from 'react-native';
import { palette } from './mocks';
import { demoTokens } from './tokens';
export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    justifyContent: 'center',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: demoTokens.radius.small,
    backgroundColor: palette.ink,
  },
  buttonText: { color: palette.surface, fontSize: 13 },
  readout: {
    marginTop: 12,
    padding: 8,
    borderRadius: demoTokens.radius.small,
    backgroundColor: demoTokens.color.soft,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    color: palette.caption,
    fontSize: 13,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.track,
    marginTop: 12,
  },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: palette.accent },
  dimmed: { opacity: 0.4 },

  screen: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 390,
    height: 620,
    borderRadius: demoTokens.radius.large,
    borderWidth: 1,
    borderColor: palette.track,
    backgroundColor: palette.surface,
    overflow: 'hidden',
  },
  topBar: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: palette.track,
  },
  topBarTitle: { fontSize: 15, fontWeight: '600', color: palette.ink },
  // The carousel fills the space the top bar leaves, and the track fills what
  // the footer leaves inside that — no fixed heights anywhere in this screen.
  pageCarousel: { flex: 1 },
  pageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 12,
    paddingRight: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: palette.track,
  },
  pageDots: { flexDirection: 'row', alignItems: 'center' },
  primaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: palette.accent,
  },
  primaryButtonText: {
    color: palette.surface,
    fontSize: 14,
    fontWeight: '600',
  },

  calendar: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: palette.calendarBg,
  },
  stripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stripTitle: { fontSize: 16, fontWeight: '600', color: palette.calendarInk },
  stripControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stripReadout: {
    fontSize: 12,
    color: palette.calendarMuted,
    fontVariant: ['tabular-nums'],
    marginRight: 4,
  },
  stripButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.calendarBorder,
    backgroundColor: palette.calendarCell,
  },
  stripButtonGlyph: { fontSize: 16, lineHeight: 18, color: palette.calendarInk },

  strip: { marginTop: 12 },
});
