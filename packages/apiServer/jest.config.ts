import type { Config } from '@jest/types';

// Sync object
const config: Config.InitialOptions = {
  // The environment in which Jest tests run (Node is typical for Express tests)
  testEnvironment: 'node',

  // Tells Jest how to transform TypeScript files via ts-jest
  transform: {
    "^.+\\.[tj]sx?$": "ts-jest",
  },

  // Looks for any files with .test.ts or .test.js (or .spec.*) inside __tests__ folders or anywhere
  testMatch: ['**/__tests__/**/*.(test|spec).ts'],

  // Tells Jest to clear mocks between tests
  clearMocks: true,

  // This is to work around a specific issue with uuid and jest which ...
  // I found out about too late in the process to use something other than uuid
  moduleNameMapper: {
    '^uuid$': '../../../node_modules/uuid/dist/esm-node/index.js',
  },
};

export default config;
