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

  await act(async () => {
    jest.advanceTimersByTime(3000);
  });

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
  const { result, rerender, initialProps, onTick } = await setup({ enabled: false });

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
