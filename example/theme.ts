/**
 * The shell's palette.
 *
 * Only the app's own chrome uses it — the recipes keep the Storybook's light
 * `palette`, because they are the thing being compared against the web build
 * and restyling them would compare two different components. So this ramp is
 * the dark, translucent ground the recipes sit *on*, not a theme applied to
 * them.
 *
 * Everything here is either opaque (the ground and the text) or an explicit
 * alpha over it: a glass surface is a colour plus a blur, and the alpha is the
 * half that survives on a platform where the blur falls back to nothing.
 */
export const theme = {
  /** Base of the background gradient, top and bottom. */
  night: '#080b18',
  /** Middle of the background gradient — a shade the blobs can sit against. */
  nightMid: '#141a35',

  /** The two soft glows behind the glass. */
  glowIndigo: 'rgba(99, 102, 241, 0.45)',
  glowCyan: 'rgba(34, 211, 238, 0.28)',
  glowFade: 'rgba(99, 102, 241, 0)',

  /** Fill of a glass panel, under whatever the blur produces. */
  glass: 'rgba(255, 255, 255, 0.07)',
  /** A pressed glass panel — the same surface, lit slightly. */
  glassPressed: 'rgba(255, 255, 255, 0.14)',
  /** The hairline that gives a glass edge its shape. */
  glassEdge: 'rgba(255, 255, 255, 0.16)',
  /** A brighter edge, for the one panel that should read as raised. */
  glassEdgeBright: 'rgba(255, 255, 255, 0.26)',

  /** Primary text on glass. */
  ink: '#f8fafc',
  /** Secondary text: titles' supporting lines, blurbs, the chevron. */
  inkMuted: 'rgba(248, 250, 252, 0.62)',
  /** Tertiary text, for the one line that should recede furthest. */
  inkFaint: 'rgba(248, 250, 252, 0.4)',
  /** The accent — the back control and the active chevron. */
  accent: '#7dd3fc',

  /** The light surface a full-screen recipe is drawn on. */
  screen: '#ffffff',

  shadow: '#000000',
} as const;
