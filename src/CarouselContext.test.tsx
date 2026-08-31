import { render, screen } from '@testing-library/react-native';
import { Text, View } from 'react-native';

import { Carousel } from './Carousel';
import { useCarousel, useCarouselOptional } from './CarouselContext';

const Optional = () => {
  const carousel = useCarouselOptional();
  return <Text>{carousel ? `inside:${carousel.pageCount}` : 'standalone'}</Text>;
};

const Required = () => {
  const { pageCount } = useCarousel();
  return <Text>{`required:${pageCount}`}</Text>;
};

describe('useCarouselOptional', () => {
  it('reads the carousel when there is one', async () => {
    await render(
      <Carousel components={{ Pagination: Optional }}>
        <View>
          <Text>a</Text>
        </View>
        <View>
          <Text>b</Text>
        </View>
      </Carousel>,
    );

    expect(screen.getByText('inside:2')).toBeTruthy();
  });

  it('returns null outside one, for chrome that works either way', async () => {
    await render(<Optional />);
    expect(screen.getByText('standalone')).toBeTruthy();
  });
});

describe('useCarousel', () => {
  it('throws outside a carousel rather than failing later', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    await expect(render(<Required />)).rejects.toThrow(/must be called inside a <Carousel>/);
    spy.mockRestore();
  });
});
