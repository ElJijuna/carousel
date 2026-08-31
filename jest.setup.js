/* eslint-disable no-undef */
require('@testing-library/react-native/extend-expect');

// The carousel drives scrolling through real timers in autoplay and through
// requestAnimationFrame when settling an `infinite` wrap. jsdom-less RN preset
// has rAF, but silence the act() noise it produces on unmount.
global.__DEV__ = true;
