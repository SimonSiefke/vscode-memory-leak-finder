import { jest } from '@jest/globals'

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
})

jest.unstable_mockModule('../src/parts/IsGithubActions/IsGithubActions.js', () => {
  return {
    isGithubActions: false,
  }
})

jest.unstable_mockModule('../src/parts/Stdout/Stdout.js', () => {
  return {
    write: jest.fn(),
  }
})

jest.unstable_mockModule('../src/parts/StdinDataState/StdinDataState.js', () => {
  return {
    isWatchMode() {
      return true
    },
    getState() {},
    setState() {},
  }
})

const Stdout = await import('../src/parts/Stdout/Stdout.js')
const HandleTestsFinished = await import('../src/parts/HandleTestsFinished/HandleTestsFinished.js')

test('handleTestsFinished - no filter value', () => {
  HandleTestsFinished.handleTestsFinished(2, 1, 0, 3, 3000, '')
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(
    '\n\x1B[1mTest Suites:\x1B[22m \x1B[1m\x1B[31m1 failed\x1B[39m\x1B[22m, \x1B[1m\x1B[32m2 passed\x1B[39m\x1B[22m, 3 total\n' +
      '\x1B[1mTime:\x1B[22m        3.000 s\n' +
      '\x1B[2mRan all test suites.\x1B[22m\n' +
      '\n' +
      '\x1B[1mWatch Usage: \x1B[22m\x1B[2mPress \x1B[22mw\x1B[2m to show more.\x1B[22m',
  )
})

test('handleTestsFinished - with filter value', () => {
  HandleTestsFinished.handleTestsFinished(2, 1, 0, 3, 3000, 'abc')
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(
    '\n\x1B[1mTest Suites:\x1B[22m \x1B[1m\x1B[31m1 failed\x1B[39m\x1B[22m, \x1B[1m\x1B[32m2 passed\x1B[39m\x1B[22m, 3 total\n' +
      '\x1B[1mTime:\x1B[22m        3.000 s\n' +
      '\x1B[2mRan all test suites matching\x1B[22m /abc/i\x1B[2m.\x1B[22m\n' +
      '\n' +
      '\x1B[1mWatch Usage: \x1B[22m\x1B[2mPress \x1B[22mw\x1B[2m to show more.\x1B[22m',
  )
})
