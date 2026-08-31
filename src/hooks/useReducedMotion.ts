import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Track the operating system's "reduce motion" accessibility setting.
 *
 * The carousel jumps straight to a page instead of animating when this is on.
 * Unlike the web, where a stylesheet could in principle undo it, the value is
 * the only thing standing between a motion-sensitive user and a sliding
 * viewport — so it is read on mount and kept live for the lifetime of the
 * component.
 *
 * @returns `true` when the user has asked for reduced motion.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let active = true;

    // Not every platform implements the query (react-native-web only does in
    // browsers that expose the media feature), so a rejection here means
    // "no preference expressed", not "failed".
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active) {
          setReduced(enabled);
        }
      })
      .catch(() => undefined);

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      setReduced(enabled);
    });

    return () => {
      active = false;
      subscription?.remove();
    };
  }, []);

  return reduced;
}
