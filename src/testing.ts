import { fireEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

/** Dimensions supplied to {@link layoutCarousel} in a test renderer. */
export interface CarouselLayoutOptions {
  /** Root width in dp. Bleed is added automatically when laying out the root. */
  width: number;
  /** Layout-event height in dp. Defaults to 0; this does not perform actual layout. */
  height?: number;
}

/**
 * Supply the layout measurement a carousel needs in a test renderer.
 * Pass its root (e.g. screen.getByTestId('carousel')) and await the result before
 * asserting slide widths or responsive page counts. Reuse after resizing or
 * rerendering. A measured track wrapper can also be passed directly; in that
 * case width is the track's measured width and bleed is not added again.
 *
 * Import from @real-native/carousel/testing with React Native Testing Library
 * installed. This entry point is independent of the production library import.
 */
export async function layoutCarousel(
  element: Parameters<typeof fireEvent>[0],
  { width, height = 0 }: CarouselLayoutOptions,
): Promise<void> {
  if (!Number.isFinite(width) || width < 0 || !Number.isFinite(height) || height < 0) {
    throw new RangeError('layoutCarousel requires finite, non-negative width and height.');
  }

  let target = element;
  let measuredWidth = width;
  if (typeof element.props.onLayout !== 'function') {
    const wrapperID = `${element.props.testID ?? 'carousel'}-track-wrapper`;
    const wrapper = element.children.find(
      (child) => typeof child !== 'string' && child.props.testID === wrapperID,
    );
    if (!wrapper || typeof wrapper === 'string' || typeof wrapper.props.onLayout !== 'function') {
      throw new Error('layoutCarousel expects a Carousel root or its measured track wrapper.');
    }
    target = wrapper;
    const margin = StyleSheet.flatten(wrapper.props.style)?.marginHorizontal;
    measuredWidth -= typeof margin === 'number' ? 2 * margin : 0;
  }

  await fireEvent(target, 'layout', {
    nativeEvent: { layout: { width: measuredWidth, height, x: 0, y: 0 } },
  });
}
