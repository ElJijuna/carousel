import { act, renderHook } from '@testing-library/react-native';

import { type UseCarouselPageOptions, useCarouselPage } from './useCarouselPage';

const setup = async (initialProps: UseCarouselPageOptions) =>
  renderHook((props: UseCarouselPageOptions) => useCarouselPage(props), {
    initialProps,
  });

describe('uncontrolled', () => {
  it('starts on page 0 by default', async () => {
    const { result } = await setup({ pageCount: 5 });
    expect(result.current.page).toBe(0);
  });

  it('honours defaultPage', async () => {
    const { result } = await setup({ pageCount: 5, defaultPage: 2 });
    expect(result.current.page).toBe(2);
  });

  it('clamps an out-of-range defaultPage rather than stranding the carousel', async () => {
    const { result } = await setup({ pageCount: 3, defaultPage: 99 });
    expect(result.current.page).toBe(2);

    const negative = await setup({ pageCount: 3, defaultPage: -4 });
    expect(negative.result.current.page).toBe(0);
  });

  it('moves and reports on commit', async () => {
    const onPageChanged = jest.fn();
    const { result } = await setup({ pageCount: 5, onPageChanged });

    await act(async () => {
      result.current.commitPage(3, 'next');
    });

    expect(result.current.page).toBe(3);
    expect(onPageChanged).toHaveBeenCalledWith(3, {
      page: 3,
      previousPage: 0,
      source: 'next',
      userInitiated: true,
    });
    expect(onPageChanged).toHaveBeenCalledTimes(1);
  });

  it('marks an autoplay tick as not user-initiated', async () => {
    const onPageChanged = jest.fn();
    const { result } = await setup({ pageCount: 5, onPageChanged });

    await act(async () => {
      result.current.commitPage(1, 'autoplay');
    });

    expect(onPageChanged).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ source: 'autoplay', userInitiated: false }),
    );
  });

  it('reports the page it moved from', async () => {
    const onPageChanged = jest.fn();
    const { result } = await setup({
      pageCount: 5,
      defaultPage: 2,
      onPageChanged,
    });

    await act(async () => {
      result.current.commitPage(4, 'pagination');
    });

    expect(onPageChanged).toHaveBeenCalledWith(
      4,
      expect.objectContaining({ page: 4, previousPage: 2 }),
    );
  });

  it('reports once per actual change, not once per scroll frame', async () => {
    const onPageChanged = jest.fn();
    const { result } = await setup({ pageCount: 5, onPageChanged });

    await act(async () => {
      // A swipe emits one of these per frame while the finger is over page 1.
      expect(result.current.commitPage(1, 'drag')).toBe(true);
      expect(result.current.commitPage(1, 'drag')).toBe(false);
      expect(result.current.commitPage(1, 'drag')).toBe(false);
    });

    expect(onPageChanged).toHaveBeenCalledTimes(1);
  });

  it('clamps a commit into range instead of leaving the range', async () => {
    const onPageChanged = jest.fn();
    const { result } = await setup({ pageCount: 3, onPageChanged });

    await act(async () => {
      result.current.commitPage(9, 'pagination');
    });

    expect(result.current.page).toBe(2);
    expect(onPageChanged).toHaveBeenCalledWith(2, expect.objectContaining({ page: 2 }));
  });

  it('treats a NaN commit as page 0', async () => {
    const { result } = await setup({ pageCount: 3, defaultPage: 2 });

    await act(async () => {
      result.current.commitPage(Number.NaN, 'pagination');
    });

    expect(result.current.page).toBe(0);
  });

  it('updates the live ref before the next render', async () => {
    const { result } = await setup({ pageCount: 5 });

    await act(async () => {
      result.current.commitPage(4, 'imperative');
      // The imperative handle reads this getter — it must not lag a render.
      expect(result.current.pageRef.current).toBe(4);
    });
  });

  it('never renders a page that a shrinking pageCount removed', async () => {
    const { result, rerender } = await setup({ pageCount: 6, defaultPage: 5 });
    expect(result.current.page).toBe(5);

    // A rotation drops visibleSlides from 1 to 3, so 6 pages become 2.
    await act(async () => {
      await rerender({ pageCount: 2, defaultPage: 5 });
    });

    expect(result.current.page).toBe(1);
  });
});

describe('controlled', () => {
  it('renders the page it was given', async () => {
    const { result } = await setup({ pageCount: 5, page: 3 });
    expect(result.current.page).toBe(3);
  });

  it('clamps the prop into range', async () => {
    const { result } = await setup({ pageCount: 3, page: 9 });
    expect(result.current.page).toBe(2);
  });

  it('reports a move but does not force the prop back', async () => {
    const onPageChanged = jest.fn();
    const { result } = await setup({ pageCount: 5, page: 1, onPageChanged });

    await act(async () => {
      result.current.commitPage(2, 'next');
    });

    expect(onPageChanged).toHaveBeenCalledWith(2, expect.objectContaining({ page: 2 }));
    // The parent owns the value; ignoring the callback keeps it where it was.
    expect(result.current.page).toBe(1);
  });

  it('follows the prop when the parent does feed it back', async () => {
    const onPageChanged = jest.fn();
    const { result, rerender } = await setup({
      pageCount: 5,
      page: 1,
      onPageChanged,
    });

    await act(async () => {
      result.current.commitPage(2, 'next');
    });
    await act(async () => {
      await rerender({ pageCount: 5, page: 2, onPageChanged });
    });

    expect(result.current.page).toBe(2);
  });

  it('ignores defaultPage entirely', async () => {
    const { result } = await setup({ pageCount: 5, page: 1, defaultPage: 4 });
    expect(result.current.page).toBe(1);
  });
});
