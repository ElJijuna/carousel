import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/** Inputs to {@link useAutoPlay}. */
export interface UseAutoPlayOptions {
  /** Whether the consumer asked for automatic rotation at all. */
  enabled: boolean;
  /** Milliseconds between advances. */
  interval: number;
  /** Whether the user is dragging the track right now. */
  isDragging: boolean;
  /** Called on each tick. Kept in a ref, so it need not be stable. */
  onTick: () => void;
}

/** What {@link useAutoPlay} hands back. */
export interface AutoPlayState {
  /**
   * Whether the rotation is running *right now* — false while paused by the
   * user, mid-drag, or with the app in the background. This is what a
   * play/pause control should render from.
   */
  isPlaying: boolean;
  /** Resume the rotation, overriding an earlier pause. */
  play: () => void;
  /** Stop the rotation. */
  pause: () => void;
}

/**
 * Drive the `autoPlay` rotation, with the pauses a moving carousel needs.
 *
 * It stops while the user is dragging (fighting a finger is never right) and
 * while the app is backgrounded (a timer that advances twenty pages behind a
 * lock screen only wastes battery and strands the user).
 *
 * WCAG 2.2.2 additionally requires a *user-reachable* way to stop it, which is
 * why {@link CarouselComponents.PlayPauseControl} exists — this hook supplies
 * the behaviour, the implementer supplies the button.
 */
export function useAutoPlay({
  enabled,
  interval,
  isDragging,
  onTick,
}: UseAutoPlayOptions): AutoPlayState {
  const [wanted, setWanted] = useState(enabled);
  const [appActive, setAppActive] = useState(true);
  const onTickRef = useRef(onTick);

  useEffect(() => {
    onTickRef.current = onTick;
  });

  // Turning `autoPlay` on after the fact should start it, and turning it off
  // should clear any pause the user had applied, so re-enabling later starts
  // from a clean slate rather than silently staying paused.
  useEffect(() => {
    setWanted(enabled);
  }, [enabled]);

  useEffect(() => {
    const handler = (status: AppStateStatus) => {
      setAppActive(status === 'active');
    };
    const subscription = AppState.addEventListener('change', handler);
    return () => {
      subscription.remove();
    };
  }, []);

  const running = enabled && wanted && appActive && !isDragging;

  useEffect(() => {
    if (!running || interval <= 0) {
      return;
    }
    const id = setInterval(() => {
      onTickRef.current();
    }, interval);
    return () => {
      clearInterval(id);
    };
  }, [running, interval]);

  const play = useCallback(() => {
    setWanted(true);
  }, []);
  const pause = useCallback(() => {
    setWanted(false);
  }, []);

  return { isPlaying: running, play, pause };
}
