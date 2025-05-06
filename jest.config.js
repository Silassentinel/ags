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
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    // Handle CSS imports
    '\\.css$': '<rootDir>/test/mocks/styleMock.js',
    // Handle Preact module imports
    '^preact$': '<rootDir>/test/mocks/preactMock.js',
    '^preact/(.*)$': '<rootDir>/test/mocks/preactMock.js'
  },
  transformIgnorePatterns: [
    // Transform node_modules except for Preact and other ESM modules
    '/node_modules/(?!(preact|@preact|preact-render-to-string)/)',
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  setupFilesAfterEnv: ['./jest.setup.ts'],
  testMatch: [
    '**/test/**/*.test.tsx',
    '**/src/**/*.test.tsx',
    '**/components/**/*.test.tsx'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  verbose: true
};

export default config;