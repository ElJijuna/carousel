// React Native Testing Library v12.4+ registers its matchers automatically on
// import, so there is nothing to wire up here. This file exists for the global
// test environment tweaks below.

// `Animated` and the scroll bridge both schedule work off the frame loop; the
// RN jest preset already fakes those, but the carousel also reads __DEV__ when
// warning about a misconfigured `data`/`renderItem` pair.
globalThis.__DEV__ = true;
