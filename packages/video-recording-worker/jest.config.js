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
  },
  testMatch: ['<rootDir>/test/**/*.ts'],
  injectGlobals: false,
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 28,
      functions: 28,
      lines: 28,
      statements: 28,
    },
  },
}
