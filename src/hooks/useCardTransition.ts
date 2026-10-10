import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, type PanResponderInstance } from 'react-native';

import type { CarouselPageChangeSource } from '../types';
import { clamp, type NavigationTarget, stepTarget } from '../utils/geometry';
import type { UseCarouselScrollOptions } from './useCarouselScroll';

interface CardOptions extends UseCarouselScrollOptions {
  enabled: boolean;
  infinite: boolean;
  controlled: boolean;
  onDragging: (dragging: boolean) => void;
}

interface Motion {
  from: number;
  to: number;
  direction: number;
  distance: number;
}

export interface CardTransition {
  angle: Animated.Value;
  faces: { front: number; back: number | null };
  backVisible: boolean;
  panHandlers: PanResponderInstance['panHandlers'];
  applyTarget: (
    target: NavigationTarget,
    animated: boolean,
    source: CarouselPageChangeSource,
  ) => void;
}

/** Shares the page model with the scroll track, but animates two stationary faces. */
export function useCardTransition(options: CardOptions): CardTransition {
  const latest = useRef(options);
  useLayoutEffect(() => {
    latest.current = options;
  });
  const [angle] = useState(() => new Animated.Value(0));
  const [faces, setFaces] = useState({ front: options.page, back: null as number | null });
  const [backVisible, setBackVisible] = useState(false);
  const presented = useRef(options.page);
  const motion = useRef<Motion | null>(null);
  const value = useRef(0);
  const running = useRef<Animated.CompositeAnimation | null>(null);
  const generation = useRef(0);
  const dragging = useRef(false);
  const snap = useRef(false);
  const instantFinish = useRef<(() => void) | null>(null);
  useLayoutEffect(() => {
    const finish = instantFinish.current;
    instantFinish.current = null;
    finish?.();
  });

  const endSnap = useCallback(() => {
    if (snap.current) {
      snap.current = false;
      latest.current.onSnapEnd?.();
    }
  }, []);

  const stop = useCallback(() => {
    generation.current += 1;
    instantFinish.current = null;
    running.current?.stop();
    running.current = null;
    motion.current = null;
    if (dragging.current) {
      dragging.current = false;
      latest.current.onDragging(false);
    }
    endSnap();
  }, [endSnap]);

  const report = useCallback((fraction: number) => {
    const { current } = motion;
    if (!current) {
      return;
    }
    const { geometry, onProgress } = latest.current;
    const absoluteProgress = current.from + current.distance * Math.abs(fraction);
    onProgress?.({
      page: Math.abs(fraction) >= 0.5 ? current.to : current.from,
      absoluteProgress,
      offset: (absoluteProgress + geometry.leadUnits) * geometry.pageStride,
    });
  }, []);

  useEffect(() => {
    const id = angle.addListener(({ value: next }) => {
      value.current = next;
      setBackVisible(Math.abs(next) >= 0.5);
      report(next);
    });
    return () => angle.removeListener(id);
  }, [angle, report]);

  // Replace the two faces and reset the rotation before the next paint.
  useLayoutEffect(() => {
    if (faces.back === null) {
      angle.setValue(0);
      value.current = 0;
    }
  }, [faces, angle]);

  const prepare = useCallback((target: NavigationTarget, direction?: number) => {
    const from = presented.current;
    const distance = target.unit - (from + latest.current.geometry.leadUnits);
    const current = {
      from,
      to: target.page,
      direction: direction ?? Math.sign(distance),
      distance,
    };
    motion.current = current;
    setFaces({ front: from, back: target.page });
    return current;
  }, []);

  const settle = useCallback(
    (accept: boolean, animated: boolean) => {
      const { current } = motion;
      if (!current) {
        return;
      }
      const token = ++generation.current;
      snap.current = true;
      latest.current.onSnapStart?.();
      const finish = () => {
        if (token !== generation.current) {
          return;
        }
        running.current = null;
        const { controlled, page, pageRef, onProgress, geometry } = latest.current;
        // A controlled owner can reject navigation by retaining its page prop.
        const destination = controlled ? page : pageRef.current;
        presented.current = destination;
        motion.current = null;
        setFaces({ front: destination, back: null });
        onProgress?.({
          page: destination,
          absoluteProgress: destination,
          offset: (destination + geometry.leadUnits) * geometry.pageStride,
        });
        endSnap();
      };
      if (!animated || latest.current.reducedMotion) {
        if (latest.current.controlled) {
          // Give the owner its batched prop update before resolving acceptance.
          instantFinish.current = finish;
        } else {
          finish();
        }
        return;
      }
      const animation = Animated.timing(angle, {
        toValue: accept ? current.direction : 0,
        duration: 320,
        // JS driver on purpose: on iOS (Fabric), faces driven natively are left at ±180° once they
        // stop animating, so their hidden backface makes the card disappear after a flip.
        useNativeDriver: false,
      });
      running.current = animation;
      animation.start(({ finished }) => {
        if (finished) {
          finish();
        }
      });
    },
    [angle, endSnap],
  );

  const applyTarget = useCallback(
    (target: NavigationTarget, animated: boolean, source: CarouselPageChangeSource) => {
      if (!latest.current.enabled || target.page === latest.current.pageRef.current) {
        return;
      }
      stop();
      angle.setValue(0);
      prepare(target);
      latest.current.commitPage(target.page, source);
      settle(true, animated);
    },
    [angle, prepare, settle, stop],
  );

  useEffect(() => {
    if (!options.enabled || options.geometry.pageStride <= 0) {
      return;
    }
    if (motion.current?.to === options.page || presented.current === options.page) {
      return;
    }
    stop();
    angle.setValue(0);
    prepare({ page: options.page, unit: options.page + options.geometry.leadUnits });
    settle(true, true);
  }, [options.enabled, options.page, options.geometry, angle, prepare, settle, stop]);

  // Layout/mode changes invalidate the external animation and its face pair.
  // biome-ignore lint/correctness/useExhaustiveDependencies: these inputs invalidate the animation, while latest supplies the current page
  useEffect(() => {
    stop();
    presented.current = latest.current.page;

    setFaces({ front: latest.current.page, back: null });
    if (dragging.current) {
      dragging.current = false;
      latest.current.onDragging(false);
    }
  }, [
    options.enabled,
    options.geometry.slideWidth,
    options.geometry.pageCount,
    options.reducedMotion,
    stop,
  ]);

  useEffect(
    () => () => {
      generation.current += 1;
      running.current?.stop();
    },
    [],
  );

  const panResponder = useMemo(() => {
    const update = (dx: number) => {
      const { geometry, infinite, rtl, reducedMotion } = latest.current;
      const logical = clamp((rtl ? dx : -dx) / geometry.slideWidth, -0.99, 0.99);
      const direction = Math.sign(logical);
      const target = stepTarget(presented.current, direction, geometry, infinite);
      if (!target || direction === 0) {
        motion.current = null;
        setFaces({ front: presented.current, back: null });
        angle.setValue(0);
        return;
      }
      if (motion.current?.to !== target.page || motion.current?.direction !== direction) {
        prepare(target, direction);
      }
      angle.setValue(reducedMotion ? 0 : logical);
      value.current = logical;
      if (reducedMotion) {
        report(logical);
      }
    };
    const release = (dx: number, cancelled: boolean) => {
      if (!dragging.current) {
        return;
      }
      update(dx);
      dragging.current = false;
      latest.current.onDragging(false);
      const accept = !cancelled && Math.abs(value.current) >= 0.25 && motion.current !== null;
      if (accept && motion.current) {
        latest.current.commitPage(motion.current.to, 'drag');
      }
      settle(accept, true);
    };
    // eslint-disable-next-line react-hooks/refs -- PanResponder stores callbacks; refs are read only when gestures arrive
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        latest.current.enabled &&
        latest.current.geometry.slideWidth > 0 &&
        latest.current.geometry.pageCount > 1 &&
        !running.current &&
        Math.abs(gesture.dx) > 6 &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderGrant: () => {
        dragging.current = true;
        latest.current.onDragging(true);
      },
      onPanResponderMove: (_, gesture) => {
        if (dragging.current) {
          update(gesture.dx);
        }
      },
      onPanResponderRelease: (_, gesture) => release(gesture.dx, false),
      onPanResponderTerminate: (_, gesture) => release(gesture.dx, true),
      onPanResponderTerminationRequest: () => false,
    });
  }, [angle, prepare, report, settle]);

  return { angle, faces, backVisible, panHandlers: panResponder.panHandlers, applyTarget };
}
