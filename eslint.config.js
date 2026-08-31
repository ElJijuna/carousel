import eslintReactTsx from 'super-configs/eslint/react/tsx';

export default [
  {
    ignores: [
      'lib/**',
      'coverage/**',
      'storybook-static/**',
      'docs/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  ...eslintReactTsx,
  {
    name: 'real-native-carousel/base',
    files: ['**/*.{ts,tsx}'],
    rules: {
      // Biome owns formatting; these stylistic rules only fight it.
      '@stylistic/brace-style': 'off',
      '@stylistic/indent': 'off',
      'import/order': 'off',
    },
  },
  {
    name: 'real-native-carousel/stories',
    files: ['**/*.stories.tsx', '.storybook/**/*.{ts,tsx}'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
    },
  },
];
