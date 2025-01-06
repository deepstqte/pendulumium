import type { Config } from '@jest/types';

// Sync object
const config: Config.InitialOptions = {
  // The environment in which Jest tests run (Node is typical for Express tests)
  testEnvironment: 'node',

  // Tells Jest how to transform TypeScript files via ts-jest
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },

  // Looks for any files with .test.ts or .test.js (or .spec.*) inside __tests__ folders or anywhere
  testMatch: ['**/__tests__/**/*.(test|spec).ts'],

  // Tells Jest to clear mocks between tests
  clearMocks: true,

  // If you're using ESM or need additional config, you can extend here
};

export default config;
