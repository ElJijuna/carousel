/** @type {import('jest').Config} */
export default {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
  // React Native ships untranspiled Flow/ESM sources, so its own packages have
  // to go through Babel rather than being treated as pre-built CJS.
  transformIgnorePatterns: [
    'node_modules/(?!(?:jest-)?react-native|@react-native(-community)?|@testing-library/react-native)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.stories.tsx',
    '!src/index.ts',
  ],
  coverageReporters: ['text', 'text-summary', 'json-summary', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
