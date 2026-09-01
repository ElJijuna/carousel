const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const root = path.resolve(__dirname, '..');
const { name, peerDependencies } = require('../package.json');

/**
 * Metro for the example app.
 *
 * The app consumes the library through its package name, and that name resolves
 * to the TypeScript source rather than to `lib/` — editing `src/Carousel.tsx`
 * reloads the running app with no build step in between. That is the whole
 * point of the app: it exercises the same code the Storybook does, on a real
 * device.
 */
const config = getDefaultConfig(__dirname);

// The library lives outside this project, so Metro has to watch the repo root
// too or nothing under `src/` triggers a reload.
config.watchFolders = [root];

const escapeForRegExp = (value) => value.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&');

// One copy of React and React Native, or the app dies on "Invalid hook call".
// The repo root has its own — the Storybook's, on a different version — and
// resolving up the directory tree from `../src` would find those first. The
// peer dependencies are exactly the packages that must be singletons, so the
// list comes from there rather than being repeated here.
const singletons = Object.keys(peerDependencies);

config.resolver.blockList = [
  ...[config.resolver.blockList].flat().filter(Boolean),
  ...singletons.map(
    (name) => new RegExp(`^${escapeForRegExp(path.join(root, 'node_modules', name))}\\/.*$`),
  ),
];

config.resolver.extraNodeModules = {
  // The library, mapped by name so the app's imports read exactly as a
  // consumer's would. It is mapped here rather than installed as a `file:..`
  // dependency because that symlink would point at a directory containing this
  // app — an unbounded `example/node_modules/<pkg>/example/node_modules/…` that
  // every recursive tool in the repo walks into.
  //
  // Metro still reads the root `package.json` from here, so the `react-native`
  // export condition is what picks `src/index.ts`. `tsconfig.json` carries the
  // matching `paths` entry for the editor.
  [name]: root,
  ...Object.fromEntries(
    singletons.map((dependency) => [dependency, path.join(__dirname, 'node_modules', dependency)]),
  ),
};

module.exports = config;
