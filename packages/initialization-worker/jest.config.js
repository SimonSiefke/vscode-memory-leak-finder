export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },

  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testEnvironment: 'node',
}
