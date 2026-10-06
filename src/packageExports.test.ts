import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

/** Exercise the resolver with simultaneous conditions, where export order matters. */
const resolveExport = (specifier: string, conditions: string[]) =>
  execFileSync(
    process.execPath,
    [
      ...conditions.map((condition) => `--conditions=${condition}`),
      '--input-type=module',
      '--eval',
      `console.log(import.meta.resolve(${JSON.stringify(specifier)}))`,
    ],
    { cwd: resolve(__dirname, '..'), encoding: 'utf8' },
  ).trim();

it.each([
  ['@real-native/carousel', 'index'],
  ['@real-native/carousel/testing', 'testing'],
])(
  'prefers compiled CommonJS for %s when Jest and React Native conditions are active',
  (specifier, entry) => {
    expect(resolveExport(specifier, ['jest', 'react-native'])).toBe(
      new URL(`../lib/commonjs/${entry}.js`, `file://${__dirname}/`).href,
    );
    expect(resolveExport(specifier, ['jest', 'react-native', 'types'])).toBe(
      new URL(`../lib/typescript/commonjs/${entry}.d.ts`, `file://${__dirname}/`).href,
    );
  },
);

it.each([
  ['@real-native/carousel', 'index'],
  ['@real-native/carousel/testing', 'testing'],
])('keeps the source export for %s without the Jest condition', (specifier, entry) => {
  expect(resolveExport(specifier, ['react-native'])).toBe(
    new URL(`../src/${entry}.ts`, `file://${__dirname}/`).href,
  );
  expect(resolveExport(specifier, [])).toBe(
    new URL(`../lib/module/${entry}.js`, `file://${__dirname}/`).href,
  );
});
