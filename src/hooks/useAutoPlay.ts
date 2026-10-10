import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, AppState, type AppStateStatus, Easing } from 'react-native';

import type { CarouselAutoPlayState } from '../types';

/** Inputs to {@link useAutoPlay}. */
export interface UseAutoPlayOptions {
  /** Whether the consumer asked for automatic rotation at all. */
  enabled: boolean;
  /** Milliseconds between advances. */
  interval: number;
  /** Whether the user is dragging the track right now. */
  isDragging: boolean;
  /** Logical page: a change restarts its dwell time. */
  page?: number;
  /** No clock is needed when there is no neighbouring page. */
  pageCount?: number;
  /** Wait until the track is at rest before counting visible time. */
  isTransitioning?: boolean;
  /** Whether the OS requests reduced motion; suspends automatic rotation. */
  reducedMotion?: boolean;
  /** Called on each tick. Kept in a ref, so it need not be stable. */
  onTick: () => void;
}

/** What {@link useAutoPlay} hands back. */
export interface AutoPlayState {
  autoPlayState: CarouselAutoPlayState;
  /** User intent, retained while transitions temporarily suspend the clock. */
  isRequested: boolean;
  /**
   * Playback state for play/pause controls; remains true during transitions.
   * False while paused by the
   * user, mid-drag, with reduced motion enabled, or with the app in the
   * background. This is what a play/pause control should render from.
   */
  isPlaying: boolean;
  /** Request rotation, overriding a manual pause but respecting reduced motion. */
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
  page = 0,
  pageCount = 2,
  isTransitioning = false,
  reducedMotion = false,
  onTick,
}: UseAutoPlayOptions): AutoPlayState {
  const [wanted, setWanted] = useState(enabled);
  const [appActive, setAppActive] = useState(
    AppState.currentState !== 'background' && AppState.currentState !== 'inactive',
  );
  const [progress] = useState(() => new Animated.Value(0));
  const [cycle, setCycle] = useState(0);
  const elapsed = useRef(0);
  const clockConfig = useRef({ enabled, interval, page, pageCount, cycle });
  const onTickRef = useRef(onTick);

  useEffect(() => {
    onTickRef.current = onTick;
  });

  // Turning `autoPlay` on after the fact should start it, and turning it off
  // should clear any pause the user had applied, so re-enabling later starts
  // from a clean slate rather than silently staying paused.
  //
  // Adjusted during render rather than in an effect: React re-runs this
  // component immediately and never commits the stale value, where an effect
  // would paint one frame with the wrong playing state first.
  const [lastEnabled, setLastEnabled] = useState(enabled);
  if (lastEnabled !== enabled) {
    setLastEnabled(enabled);
    setWanted(enabled);
  }

  useEffect(() => {
    const handler = (status: AppStateStatus) => {
      setAppActive(status === 'active');
    };
    const subscription = AppState.addEventListener('change', handler);
    return () => {
      subscription.remove();
    };
  }, []);

  const validDuration = Number.isFinite(interval) && interval > 0;
  const isRequested = enabled && wanted && validDuration && pageCount > 1;
  const playing = isRequested && appActive && !isDragging && !reducedMotion;
  const running = playing && !isTransitioning;

  useEffect(() => {
    const previous = clockConfig.current;
    if (
      previous.enabled !== enabled ||
      previous.interval !== interval ||
      previous.page !== page ||
      previous.pageCount !== pageCount ||
      previous.cycle !== cycle
    ) {
      elapsed.current = 0;
      progress.setValue(0);
      clockConfig.current = { enabled, interval, page, pageCount, cycle };
    }
    if (!running) {
      return;
    }
    const startedAt = Date.now();
    const alreadyElapsed = elapsed.current;
    const remaining = Math.max(0, interval - alreadyElapsed);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: remaining,
      easing: Easing.linear,
      useNativeDriver: false,
      isInteraction: false,
    });
    let completed = false;
    animation.start();
    // The deadline completes the value exactly, independent of frame cadence.
    // It is the only place that advances: animation callbacks never navigate.
    const id = setTimeout(() => {
      completed = true;
      elapsed.current = interval;
      animation.stop();
      progress.setValue(1);
      onTickRef.current();
      setCycle((previousCycle) => previousCycle + 1);
    }, remaining);
    return () => {
      clearTimeout(id);
      animation.stop();
      if (!completed) {
        elapsed.current = Math.min(interval, Math.max(0, alreadyElapsed + Date.now() - startedAt));
        progress.setValue(elapsed.current / interval);
      }
    };
  }, [running, enabled, interval, page, pageCount, cycle, progress]);

  const play = useCallback(() => {
    setWanted(true);
  }, []);
  const pause = useCallback(() => {
    setWanted(false);
  }, []);

  const autoPlayState = useMemo<CarouselAutoPlayState>(
    () => ({
      enabled,
      isPlaying: running,
      duration: validDuration ? interval : 0,
      progress,
    }),
    [enabled, running, validDuration, interval, progress],
  );

  return { isPlaying: playing, isRequested, autoPlayState, play, pause };
}
