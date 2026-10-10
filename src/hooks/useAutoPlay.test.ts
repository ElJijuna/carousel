import { act, renderHook } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';

import { type UseAutoPlayOptions, useAutoPlay } from './useAutoPlay';

/** Drive the AppState listener the hook registers on mount. */
let appStateListener: ((status: AppStateStatus) => void) | undefined;

beforeEach(() => {
  jest.useFakeTimers();
  appStateListener = undefined;
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, handler) => {
    appStateListener = handler as (status: AppStateStatus) => void;
    return { remove: jest.fn() } as unknown as ReturnType<typeof AppState.addEventListener>;
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const setup = async (overrides: Partial<UseAutoPlayOptions> = {}) => {
  const onTick = jest.fn();
  const initialProps: UseAutoPlayOptions = {
    enabled: true,
    interval: 1000,
    isDragging: false,
    onTick,
    ...overrides,
  };
  const view = await renderHook((props: UseAutoPlayOptions) => useAutoPlay(props), {
    initialProps,
  });
  return { ...view, onTick, initialProps };
};

it('advances on the interval', async () => {
  const { onTick } = await setup();

  for (let cycle = 0; cycle < 3; cycle += 1) {
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
  }

  expect(onTick).toHaveBeenCalledTimes(3);
});

it('stays still when autoPlay was never asked for', async () => {
  const { result, onTick } = await setup({ enabled: false });

  await act(async () => {
    jest.advanceTimersByTime(5000);
  });

  expect(onTick).not.toHaveBeenCalled();
  expect(result.current.isPlaying).toBe(false);
});

it('reports isPlaying so a control can render the right glyph', async () => {
  const { result } = await setup();
  expect(result.current.isPlaying).toBe(true);

  await act(async () => {
    result.current.pause();
  });
  expect(result.current.isPlaying).toBe(false);

  await act(async () => {
    result.current.play();
  });
  expect(result.current.isPlaying).toBe(true);
});

it('stops ticking once paused', async () => {
  const { result, onTick } = await setup();

  // Separate acts: the pause has to be committed and the interval torn down
  // before the clock moves, exactly as it would be between real renders.
  await act(async () => {
    result.current.pause();
  });
  await act(async () => {
    jest.advanceTimersByTime(5000);
  });

  expect(onTick).not.toHaveBeenCalled();
});

it('never fights a finger', async () => {
  const { result, onTick, rerender, initialProps } = await setup();

  await act(async () => {
    await rerender({ ...initialProps, isDragging: true });
  });
  expect(result.current.isPlaying).toBe(false);

  await act(async () => {
    jest.advanceTimersByTime(5000);
  });
  expect(onTick).not.toHaveBeenCalled();

  // Letting go resumes without the user having to press play.
  await act(async () => {
    await rerender({ ...initialProps, isDragging: false });
  });
  expect(result.current.isPlaying).toBe(true);
});

it('stops while the app is in the background', async () => {
  const { result, onTick } = await setup();

  await act(async () => {
    appStateListener?.('background');
  });
  expect(result.current.isPlaying).toBe(false);

  await act(async () => {
    jest.advanceTimersByTime(10_000);
  });
  // Otherwise the deck advances ten pages behind a lock screen.
  expect(onTick).not.toHaveBeenCalled();

  await act(async () => {
    appStateListener?.('active');
  });
  expect(result.current.isPlaying).toBe(true);
});

it('starts when autoPlay is turned on after mount', async () => {
  const { result, rerender, initialProps, onTick } = await setup({
    enabled: false,
  });

  await act(async () => {
    await rerender({ ...initialProps, enabled: true });
  });
  expect(result.current.isPlaying).toBe(true);

  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
  expect(onTick).toHaveBeenCalledTimes(1);
});

it('clears a manual pause when autoPlay is toggled off and on again', async () => {
  const { result, rerender, initialProps } = await setup();

  await act(async () => {
    result.current.pause();
  });
  await act(async () => {
    await rerender({ ...initialProps, enabled: false });
  });
  await act(async () => {
    await rerender({ ...initialProps, enabled: true });
  });

  expect(result.current.isPlaying).toBe(true);
});

it('ignores a non-positive interval instead of spinning', async () => {
  const { onTick } = await setup({ interval: 0 });

  await act(async () => {
    jest.advanceTimersByTime(5000);
  });

  expect(onTick).not.toHaveBeenCalled();
});

it('always calls the latest onTick, never a stale closure', async () => {
  const first = jest.fn();
  const second = jest.fn();
  const { rerender, initialProps } = await setup({ onTick: first });

  await act(async () => {
    await rerender({ ...initialProps, onTick: second });
  });
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });

  expect(first).not.toHaveBeenCalled();
  expect(second).toHaveBeenCalledTimes(1);
});

it('stops ticking after unmount', async () => {
  const { onTick, unmount } = await setup();

  await act(async () => {
    await unmount();
  });
  await act(async () => {
    jest.advanceTimersByTime(5000);
  });

  expect(onTick).not.toHaveBeenCalled();
});

it('does not tick or report playing with reduced motion, even after play()', async () => {
  const { result, onTick } = await setup({ reducedMotion: true });
  expect(result.current.isPlaying).toBe(false);
  await act(async () => {
    result.current.play();
  });
  await act(async () => {
    jest.advanceTimersByTime(5000);
  });
  expect(onTick).not.toHaveBeenCalled();
  expect(result.current.isPlaying).toBe(false);
});

it('suspends rotation on a preference change and resumes with the remaining time', async () => {
  const { result, onTick, rerender, initialProps } = await setup();
  await act(async () => {
    jest.advanceTimersByTime(500);
  });
  await rerender({ ...initialProps, reducedMotion: true });
  expect(result.current.isPlaying).toBe(false);
  await act(async () => {
    jest.advanceTimersByTime(5000);
  });
  expect(onTick).not.toHaveBeenCalled();
  await rerender({ ...initialProps, reducedMotion: false });
  expect(result.current.isPlaying).toBe(true);
  await act(async () => {
    jest.advanceTimersByTime(499);
  });
  expect(onTick).not.toHaveBeenCalled();
  await act(async () => {
    jest.advanceTimersByTime(1);
  });
  expect(onTick).toHaveBeenCalledTimes(1);
});

it('preserves a manual pause when reduced motion is turned off', async () => {
  const { result, onTick, rerender, initialProps } = await setup();
  await act(async () => {
    result.current.pause();
  });
  await rerender({ ...initialProps, reducedMotion: true });
  await rerender({ ...initialProps, reducedMotion: false });
  expect(result.current.isPlaying).toBe(false);
  await act(async () => {
    jest.advanceTimersByTime(5000);
  });
  expect(onTick).not.toHaveBeenCalled();
});

it('freezes the public value and advances only after the remaining visible time', async () => {
  const { result, onTick } = await setup();
  const { progress } = result.current.autoPlayState;
  const values: number[] = [];
  const listener = progress.addListener(({ value }) => values.push(value));
  await act(async () => {
    jest.advanceTimersByTime(400);
    result.current.pause();
  });
  expect(values.at(-1)).toBeCloseTo(0.4);
  expect(result.current.autoPlayState).toMatchObject({
    enabled: true,
    isPlaying: false,
    duration: 1000,
  });
  const pausedValue = values.at(-1);
  await act(async () => {
    jest.advanceTimersByTime(10_000);
  });
  expect(values.at(-1)).toBe(pausedValue);
  await act(async () => {
    result.current.play();
  });
  expect(result.current.autoPlayState.progress).toBe(progress);
  await act(async () => {
    jest.advanceTimersByTime(599);
  });
  expect(onTick).not.toHaveBeenCalled();
  await act(async () => {
    jest.advanceTimersByTime(1);
  });
  expect(onTick).toHaveBeenCalledTimes(1);
  expect(values).toContain(1);
  progress.removeListener(listener);
});

it('resets on page changes and waits for the transition to finish', async () => {
  const { result, onTick, rerender, initialProps } = await setup();
  const values: number[] = [];
  const id = result.current.autoPlayState.progress.addListener(({ value }) => values.push(value));
  await act(async () => {
    jest.advanceTimersByTime(400);
  });
  await rerender({ ...initialProps, page: 1, isTransitioning: true });
  expect(values.at(-1)).toBe(0);
  await act(async () => {
    jest.advanceTimersByTime(5000);
  });
  expect(onTick).not.toHaveBeenCalled();
  expect(result.current.autoPlayState.isPlaying).toBe(false);
  await rerender({ ...initialProps, page: 1, isTransitioning: false });
  await act(async () => {
    jest.advanceTimersByTime(999);
  });
  expect(onTick).not.toHaveBeenCalled();
  await act(async () => {
    jest.advanceTimersByTime(1);
  });
  expect(onTick).toHaveBeenCalledTimes(1);
  result.current.autoPlayState.progress.removeListener(id);
});

it.each(['drag', 'background'] as const)('retains elapsed time during %s', async (reason) => {
  const { onTick, rerender, initialProps } = await setup();
  await act(async () => {
    jest.advanceTimersByTime(350);
  });
  if (reason === 'drag') {
    await rerender({ ...initialProps, isDragging: true });
  } else {
    await act(async () => {
      appStateListener?.('background');
    });
  }
  await act(async () => {
    jest.advanceTimersByTime(3000);
  });
  if (reason === 'drag') {
    await rerender(initialProps);
  } else {
    await act(async () => {
      appStateListener?.('active');
    });
  }
  await act(async () => {
    jest.advanceTimersByTime(649);
  });
  expect(onTick).not.toHaveBeenCalled();
  await act(async () => {
    jest.advanceTimersByTime(1);
  });
  expect(onTick).toHaveBeenCalledTimes(1);
});

it('restarts on duration changes even while paused and clears progress when disabled', async () => {
  const { result, onTick, rerender, initialProps } = await setup();
  const values: number[] = [];
  const { progress } = result.current.autoPlayState;
  const id = progress.addListener(({ value }) => values.push(value));
  await act(async () => {
    jest.advanceTimersByTime(400);
    result.current.pause();
  });
  await rerender({ ...initialProps, interval: 2000 });
  expect(values.at(-1)).toBe(0);
  expect(result.current.autoPlayState.duration).toBe(2000);
  await act(async () => {
    result.current.play();
  });
  await act(async () => {
    jest.advanceTimersByTime(1999);
  });
  expect(onTick).not.toHaveBeenCalled();
  await act(async () => {
    jest.advanceTimersByTime(1);
  });
  expect(onTick).toHaveBeenCalledTimes(1);
  await rerender({ ...initialProps, enabled: false });
  expect(values.at(-1)).toBe(0);
  expect(result.current.autoPlayState.progress).toBe(progress);
  progress.removeListener(id);
});

it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
  'disables invalid duration %s',
  async (interval) => {
    const { result, onTick } = await setup({ interval });
    expect(result.current.autoPlayState.duration).toBe(0);
    expect(result.current.isPlaying).toBe(false);
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    expect(onTick).not.toHaveBeenCalled();
  },
);

it.each([0, 1])('does not run a clock with %s pages', async (pageCount) => {
  const { result, onTick } = await setup({ pageCount });
  expect(result.current.isPlaying).toBe(false);
  await act(async () => {
    jest.advanceTimersByTime(5000);
  });
  expect(onTick).not.toHaveBeenCalled();
});
