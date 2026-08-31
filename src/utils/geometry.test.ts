import {
  clamp,
  computeGeometry,
  type GeometryInput,
  goToTarget,
  mirrorOffset,
  offsetForPage,
  offsetForUnit,
  pageForSlide,
  pageFromOffset,
  snapOffsets,
  sourceIndexFor,
  stepTarget,
  unitFromOffset,
  withClones,
  wrapIndex,
} from './geometry';

const geometry = (overrides: Partial<GeometryInput> = {}) =>
  computeGeometry({
    containerWidth: 300,
    slideCount: 5,
    visibleSlides: 1,
    peek: 0,
    spacing: 0,
    infinite: false,
    ...overrides,
  });

describe('wrapIndex', () => {
  it('wraps in both directions', () => {
    expect(wrapIndex(0, 3)).toBe(0);
    expect(wrapIndex(3, 3)).toBe(0);
    expect(wrapIndex(-1, 3)).toBe(2);
    expect(wrapIndex(-4, 3)).toBe(2);
    expect(wrapIndex(7, 3)).toBe(1);
  });

  it('returns 0 for an empty range instead of NaN', () => {
    expect(wrapIndex(2, 0)).toBe(0);
  });
});

describe('clamp', () => {
  it('bounds on both sides and passes values through', () => {
    expect(clamp(-1, 0, 5)).toBe(0);
    expect(clamp(9, 0, 5)).toBe(5);
    expect(clamp(3, 0, 5)).toBe(3);
  });
});

describe('computeGeometry', () => {
  it('gives one full-width slide per page by default', () => {
    const g = geometry();
    expect(g.visibleSlides).toBe(1);
    expect(g.pageCount).toBe(5);
    expect(g.slideWidth).toBe(300);
    expect(g.pageStride).toBe(300);
    expect(g.contentWidth).toBe(1500);
    expect(g.maxScrollOffset).toBe(1200);
    expect(g.cloned).toBe(false);
    expect(g.unitCount).toBe(5);
  });

  it('splits the viewport across visibleSlides, minus peek and spacing', () => {
    // 300 - 2*20 peek - 1*10 spacing = 250 across 2 slides.
    const g = geometry({ visibleSlides: 2, peek: 20, spacing: 10 });
    expect(g.slideWidth).toBe(125);
    expect(g.slideStride).toBe(135);
    expect(g.pageStride).toBe(270);
    expect(g.pageCount).toBe(3);
    expect(g.contentWidth).toBe(705);
    expect(g.maxScrollOffset).toBe(405);
  });

  it('normalises visibleSlides to an integer of at least 1', () => {
    expect(geometry({ visibleSlides: 2.9 }).visibleSlides).toBe(2);
    expect(geometry({ visibleSlides: 0 }).visibleSlides).toBe(1);
    expect(geometry({ visibleSlides: -3 }).visibleSlides).toBe(1);
    expect(geometry({ visibleSlides: Number.NaN }).visibleSlides).toBe(1);
  });

  it('floors pageCount at 1 so an empty carousel still divides cleanly', () => {
    const g = geometry({ slideCount: 0 });
    expect(g.pageCount).toBe(1);
    expect(g.renderedSlideCount).toBe(0);
    expect(g.contentWidth).toBe(0);
    expect(g.maxScrollOffset).toBe(0);
  });

  it('never reports a negative slide width when peek eats the viewport', () => {
    expect(geometry({ peek: 400 }).slideWidth).toBe(0);
  });

  it('reports zero-width geometry before the first layout pass', () => {
    const g = geometry({ containerWidth: 0 });
    expect(g.slideWidth).toBe(0);
    expect(g.pageStride).toBe(0);
  });

  it('clones one page at each end when infinite', () => {
    const g = geometry({ slideCount: 6, visibleSlides: 2, infinite: true });
    expect(g.cloned).toBe(true);
    expect(g.leadingClones).toBe(2);
    expect(g.trailingClones).toBe(2);
    expect(g.renderedSlideCount).toBe(10);
    expect(g.leadUnits).toBe(1);
    expect(g.unitCount).toBe(5); // 3 real pages + a clone page at each end
  });

  it('does not clone when everything already fits on one page', () => {
    const g = geometry({ slideCount: 2, visibleSlides: 2, infinite: true });
    expect(g.cloned).toBe(false);
    expect(g.leadUnits).toBe(0);
    expect(g.renderedSlideCount).toBe(2);
  });
});

describe('offsets', () => {
  it('places page n at n page-strides', () => {
    const g = geometry();
    expect(offsetForPage(0, g)).toBe(0);
    expect(offsetForPage(2, g)).toBe(600);
    expect(snapOffsets(g)).toEqual([0, 300, 600, 900, 1200]);
  });

  it('clamps the tail flush to the content edge', () => {
    // 5 slides in groups of 2: the last page's ideal offset (540) lies past the
    // end of the content, so it rests at 405 instead.
    const g = geometry({ visibleSlides: 2, peek: 20, spacing: 10 });
    expect(snapOffsets(g)).toEqual([0, 270, 405]);
  });

  it('never merges two real pages when clamping', () => {
    const g = geometry({ visibleSlides: 2, peek: 20, spacing: 10 });
    const offsets = snapOffsets(g);
    expect(new Set(offsets).size).toBe(offsets.length);
  });

  it('shifts every real page past the leading clone', () => {
    const g = geometry({ slideCount: 6, visibleSlides: 2, infinite: true });
    expect(offsetForUnit(0, g)).toBe(0);
    expect(offsetForPage(0, g)).toBe(300);
    expect(offsetForPage(2, g)).toBe(900);
    expect(snapOffsets(g)).toEqual([0, 300, 600, 900, 1200]);
  });

  it('produces no snap points before the first layout pass', () => {
    expect(snapOffsets(geometry({ containerWidth: 0 }))).toEqual([]);
  });

  it('mirrors the snap points for right-to-left, still ascending', () => {
    const g = geometry();
    expect(snapOffsets(g, true)).toEqual([0, 300, 600, 900, 1200]);

    const uneven = geometry({ visibleSlides: 2, peek: 20, spacing: 10 });
    // Logical [0, 270, 405] mirrored about maxScroll 405 is [405, 135, 0],
    // which the scroller needs handed back ascending.
    expect(snapOffsets(uneven, true)).toEqual([0, 135, 405]);
  });
});

describe('mirrorOffset', () => {
  it('leaves offsets alone for left-to-right', () => {
    const g = geometry();
    expect(mirrorOffset(300, g, false)).toBe(300);
  });

  it('flips an offset about the content edge for right-to-left', () => {
    const g = geometry(); // maxScroll 1200
    expect(mirrorOffset(0, g, true)).toBe(1200);
    expect(mirrorOffset(1200, g, true)).toBe(0);
    expect(mirrorOffset(300, g, true)).toBe(900);
  });

  it('is its own inverse', () => {
    const g = geometry();
    expect(mirrorOffset(mirrorOffset(450, g, true), g, true)).toBe(450);
  });
});

describe('unitFromOffset', () => {
  it('snaps a resting offset to the nearest unit', () => {
    const g = geometry();
    expect(unitFromOffset(0, g)).toBe(0);
    expect(unitFromOffset(310, g)).toBe(1);
    expect(unitFromOffset(449, g)).toBe(1);
    expect(unitFromOffset(451, g)).toBe(2);
  });

  it('reads the clamped last page correctly, which division would not', () => {
    // 405 / 270 rounds to 2 by luck here, but 380 would round to 1 while
    // actually resting nearest the clamped last page.
    const g = geometry({ visibleSlides: 2, peek: 20, spacing: 10 });
    expect(unitFromOffset(405, g)).toBe(2);
    expect(unitFromOffset(380, g)).toBe(2);
  });

  it('returns 0 for a degenerate geometry', () => {
    expect(unitFromOffset(100, geometry({ containerWidth: 0 }))).toBe(0);
    expect(unitFromOffset(100, geometry({ slideCount: 0 }))).toBe(0);
  });
});

describe('pageFromOffset', () => {
  it('maps offsets straight to pages without clones', () => {
    const g = geometry();
    expect(pageFromOffset(600, g)).toEqual({
      page: 2,
      unit: 2,
      onClone: false,
    });
  });

  it('reads the leading clone as the last page', () => {
    const g = geometry({ slideCount: 6, visibleSlides: 2, infinite: true });
    expect(pageFromOffset(0, g)).toEqual({ page: 2, unit: 0, onClone: true });
  });

  it('reads the trailing clone as the first page', () => {
    const g = geometry({ slideCount: 6, visibleSlides: 2, infinite: true });
    expect(pageFromOffset(1200, g)).toEqual({
      page: 0,
      unit: 4,
      onClone: true,
    });
  });

  it('maps real units back past the leading clone', () => {
    const g = geometry({ slideCount: 6, visibleSlides: 2, infinite: true });
    expect(pageFromOffset(600, g)).toEqual({
      page: 1,
      unit: 2,
      onClone: false,
    });
  });
});

describe('stepTarget', () => {
  it('moves one page inside the range', () => {
    const g = geometry();
    expect(stepTarget(1, 1, g, false)).toEqual({ page: 2, unit: 2 });
    expect(stepTarget(1, -1, g, false)).toEqual({ page: 0, unit: 0 });
  });

  it('refuses to move past an end that does not wrap', () => {
    const g = geometry();
    expect(stepTarget(4, 1, g, false)).toBeNull();
    expect(stepTarget(0, -1, g, false)).toBeNull();
  });

  it('never reports a move onto the page you are already on', () => {
    const g = geometry();
    expect(stepTarget(2, 0, g, true)).toBeNull();
  });

  it('rewinds to the other end when looping without clones', () => {
    const g = geometry();
    expect(stepTarget(4, 1, g, true)).toEqual({ page: 0, unit: 0 });
    expect(stepTarget(0, -1, g, true)).toEqual({ page: 4, unit: 4 });
  });

  it('travels through the clone page and schedules the fix-up when infinite', () => {
    const g = geometry({ slideCount: 6, visibleSlides: 2, infinite: true });
    // Forward off the end: scroll on to unit 4 (the trailing clone), then jump
    // silently back to unit 1, which is real page 0.
    expect(stepTarget(2, 1, g, true)).toEqual({ page: 0, unit: 4 });
    // Backward off the start: scroll to unit 0, then jump to unit 3.
    expect(stepTarget(0, -1, g, true)).toEqual({ page: 2, unit: 0 });
  });

  it('jumps rather than travelling for multi-page wraps', () => {
    const g = geometry({ slideCount: 6, visibleSlides: 2, infinite: true });
    expect(stepTarget(0, -2, g, true)).toEqual({ page: 1, unit: 2 });
  });

  it('reports no move when a wrap lands back on the current page', () => {
    const single = geometry({ slideCount: 1 });
    expect(stepTarget(0, 1, single, true)).toBeNull();
  });
});

describe('goToTarget', () => {
  it('clamps into range instead of wrapping', () => {
    const g = geometry();
    expect(goToTarget(9, g)).toEqual({ page: 4, unit: 4 });
    expect(goToTarget(-3, g)).toEqual({ page: 0, unit: 0 });
  });

  it('offsets by the leading clone when infinite', () => {
    const g = geometry({ slideCount: 6, visibleSlides: 2, infinite: true });
    expect(goToTarget(1, g)).toEqual({ page: 1, unit: 2 });
  });

  it('treats a non-integer page as its floor and NaN as 0', () => {
    const g = geometry();
    expect(goToTarget(2.7, g).page).toBe(2);
    expect(goToTarget(Number.NaN, g).page).toBe(0);
  });
});

describe('pageForSlide', () => {
  it('divides by visibleSlides rather than treating slides as pages', () => {
    const g = geometry({ visibleSlides: 2 });
    expect(pageForSlide(0, g, 5)).toBe(0);
    expect(pageForSlide(3, g, 5)).toBe(1);
    expect(pageForSlide(4, g, 5)).toBe(2);
  });

  it('clamps out-of-range slides', () => {
    const g = geometry({ visibleSlides: 2 });
    expect(pageForSlide(99, g, 5)).toBe(2);
    expect(pageForSlide(-4, g, 5)).toBe(0);
  });

  it('survives an empty carousel', () => {
    const g = geometry({ slideCount: 0 });
    expect(pageForSlide(3, g, 0)).toBe(0);
  });
});

describe('sourceIndexFor', () => {
  const g = geometry({ slideCount: 6, visibleSlides: 2, infinite: true });

  it('maps leading clones to the slides at the end', () => {
    expect(sourceIndexFor(0, g, 6)).toBe(4);
    expect(sourceIndexFor(1, g, 6)).toBe(5);
  });

  it('maps the real range straight through', () => {
    expect(sourceIndexFor(2, g, 6)).toBe(0);
    expect(sourceIndexFor(7, g, 6)).toBe(5);
  });

  it('maps trailing clones back to the slides at the start', () => {
    expect(sourceIndexFor(8, g, 6)).toBe(0);
    expect(sourceIndexFor(9, g, 6)).toBe(1);
  });

  it('is the identity without clones', () => {
    const plain = geometry();
    expect(sourceIndexFor(3, plain, 5)).toBe(3);
  });
});

describe('withClones', () => {
  it('pads a slide list at both ends', () => {
    const g = geometry({ slideCount: 6, visibleSlides: 2, infinite: true });
    expect(withClones([0, 1, 2, 3, 4, 5], g)).toEqual([4, 5, 0, 1, 2, 3, 4, 5, 0, 1]);
  });

  it('returns the same list untouched when not cloning', () => {
    const items = [0, 1, 2];
    expect(withClones(items, geometry())).toBe(items);
  });
});
