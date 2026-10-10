import { createEslintConfig } from 'super-configs/eslint';

export default createEslintConfig({
  reactNative: true,
  language: 'ts',
  ignores: [
    'lib/**',
    'coverage/**',
    'storybook-static/**',
    'docs/**',
    'node_modules/**',
    'playwright-report/**',
    'test-results/**',
  ],
  overrides: [
    {
      name: 'real-native-carousel/stories',
      files: ['**/*.stories.tsx', '.storybook/**/*.{ts,tsx}'],
      rules: {
        'react-hooks/rules-of-hooks': 'off',
      },
    },
  ],
});
