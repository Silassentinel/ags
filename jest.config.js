/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
    // @testing-library/preact 3.x ships ESM-only .mjs; ts-jest compiles it
    // to CommonJS for Jest (allowJs is set in the ts-jest tsconfig below).
    '^.+\\.m?js$': [
      'ts-jest',
      {
        useESM: false,
        tsconfig: { allowJs: true, module: 'commonjs', esModuleInterop: true },
        diagnostics: false,
      },
    ],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    // Handle CSS imports
    '\\.css$': '<rootDir>/test/mocks/styleMock.js'
  },
  transformIgnorePatterns: [
    // Transform node_modules except for Preact and other ESM modules
    '/node_modules/(?!(preact|@preact|preact-render-to-string|@testing-library)/)',
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  setupFilesAfterEnv: ['./jest.setup.ts'],
  testMatch: [
    '**/test/**/*.test.{ts,tsx}',
    '**/src/**/*.test.{ts,tsx}',
    '**/components/**/*.test.{ts,tsx}'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  verbose: true,
  testPathIgnorePatterns: [
    '/node_modules/'
  ]
};

export default config;