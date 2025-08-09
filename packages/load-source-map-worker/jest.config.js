export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '#ansi-styles': 'ansi-styles/index.js',
    '#supports-color': 'supports-color/index.js',
  },
  testMatch: ['<rootDir>/test/**/*.ts'],
  modulePathIgnorePatterns: ['<rootDir>/.vscode-test/'],
  injectGlobals: false,
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 5,
      functions: 5,
      lines: 5,
      statements: 5,
    },
  },
}
