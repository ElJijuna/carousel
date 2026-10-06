import { render, screen } from '@testing-library/react-native';
import { View } from 'react-native';

import { Carousel } from './Carousel';
import { layoutCarousel } from './testing';

it.each([false, true])(
  'sizes slides and updates responsive groups (data=%s)',
  async (virtualized) => {
    await render(
      <Carousel
        testID="c"
        visibleSlides={{ base: 2, 400: 1 }}
        data={virtualized ? [0, 1, 2, 3] : undefined}
        renderItem={() => <View />}
      >
        {virtualized
          ? undefined
          : [<View key="a" />, <View key="b" />, <View key="c" />, <View key="d" />]}
      </Carousel>,
    );
    await layoutCarousel(screen.getByTestId('c'), { width: 360 });
    expect(screen.getByLabelText('1 of 4')).toHaveStyle({ width: 360 });
    await layoutCarousel(screen.getByTestId('c'), { width: 600 });
    expect(screen.getByLabelText('1 of 4')).toHaveStyle({ width: 300 });
  },
);

it.each(['c', undefined])('adds bleed when measuring a root with testID=%s', async (testID) => {
  await render(
    <Carousel testID={testID} bleed={24} peek={32}>
      <View />
      <View />
    </Carousel>,
  );
  await layoutCarousel(screen.getByLabelText('Carousel'), { width: 300 });
  expect(screen.getByLabelText('1 of 2')).toHaveStyle({ width: 284 });
});

it('does not add bleed again when passed the measured wrapper', async () => {
  await render(
    <Carousel testID="c" bleed={24} peek={32}>
      <View />
      <View />
    </Carousel>,
  );
  await layoutCarousel(screen.getByTestId('c-track-wrapper'), { width: 348, height: 200 });
  expect(screen.getByLabelText('1 of 2')).toHaveStyle({ width: 284 });
});

it('rejects elements that do not measure a carousel', async () => {
  await render(<View testID="other" />);
  await expect(layoutCarousel(screen.getByTestId('other'), { width: 300 })).rejects.toThrow(
    'Carousel root',
  );
});

it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid width %s', async (width) => {
  await render(
    <Carousel testID="c">
      <View />
    </Carousel>,
  );
  await expect(layoutCarousel(screen.getByTestId('c'), { width })).rejects.toThrow(RangeError);
});
