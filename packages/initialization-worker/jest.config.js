export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1.ts',
  },
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testEnvironment: 'node',
}
