import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Animated, View } from 'react-native';

import { Carousel } from './Carousel';
import { DefaultDot } from './DefaultDot';
import { layoutCarousel } from './testing';

it('labels the button, exposes selected state and navigates its page', async () => {
  const onPageChanged = jest.fn();
  await render(
    <Carousel testID="c" components={{ Dot: DefaultDot }} onPageChanged={onPageChanged}>
      <View />
      <View />
      <View />
    </Carousel>,
  );
  await layoutCarousel(screen.getByTestId('c'), { width: 300 });
  expect(screen.getByRole('button', { name: 'Page 1', selected: true })).toBeTruthy();
  const second = screen.getByRole('button', { name: 'Page 2', selected: false });
  expect(second).toHaveStyle({ minWidth: 44, minHeight: 44 });
  expect(second.props.hitSlop).toBe(8);
  await fireEvent.press(second);
  expect(onPageChanged).toHaveBeenCalledWith(1, expect.objectContaining({ source: 'pagination' }));
  expect(screen.getByRole('button', { name: 'Page 2', selected: true })).toBeTruthy();
});

it('allows line indicators without changing the button or its semantics', async () => {
  const props = {
    index: 0,
    total: 2,
    selected: false,
    onPress: jest.fn(),
    accessibilityLabel: 'Page 1',
  };
  const view = await render(
    <DefaultDot
      {...props}
      testID="dot"
      style={{ width: 24, height: 3 }}
      selectedStyle={{ width: 40, opacity: 1 }}
      containerStyle={{ padding: 4 }}
      hitSlop={12}
    />,
  );
  expect(screen.getByTestId('dot').children[0]).toHaveStyle({ width: 24, height: 3 });
  await view.rerender(
    <DefaultDot
      {...props}
      selected
      testID="dot"
      style={{ width: 24, height: 3 }}
      selectedStyle={{ width: 40, opacity: 1 }}
      containerStyle={{ padding: 4 }}
      hitSlop={12}
    />,
  );
  expect(screen.getByTestId('dot').children[0]).toHaveStyle({ width: 40, height: 3, opacity: 1 });
  expect(screen.getByTestId('dot')).toHaveStyle({ padding: 4 });
  expect(screen.getByTestId('dot').props.hitSlop).toBe(12);
});

it('fills the selected indicator from the shared clock and permits an opt-out', async () => {
  const fillColor = 'red';
  const progress = new Animated.Value(0);
  const props = {
    index: 0,
    total: 3,
    selected: true,
    accessibilityLabel: 'Page 1',
    onPress: jest.fn(),
    autoPlayState: { enabled: true, isPlaying: true, duration: 1000, progress },
  };
  const view = await render(
    <DefaultDot {...props} testID="dot" progressStyle={{ backgroundColor: fillColor }} />,
  );
  expect(screen.getByTestId('dot').children[0]).toHaveStyle({ width: 32, overflow: 'hidden' });
  expect(screen.getByTestId('dot-progress')).toHaveStyle({ width: '0%', backgroundColor: 'red' });
  await act(async () => {
    progress.setValue(0.5);
  });
  expect(screen.getByTestId('dot-progress')).toHaveStyle({ width: '50%' });
  expect(screen.getByRole('button', { name: 'Page 1', selected: true })).toBeTruthy();
  await view.rerender(<DefaultDot {...props} testID="dot" showAutoPlayProgress={false} />);
  expect(screen.queryByTestId('dot-progress')).toBeNull();
  expect(screen.getByTestId('dot').children[0]).toHaveStyle({ width: 8 });
  await view.rerender(<DefaultDot {...props} testID="dot" selected={false} />);
  expect(screen.queryByTestId('dot-progress')).toBeNull();
});
