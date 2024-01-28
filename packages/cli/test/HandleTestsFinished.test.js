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
  HandleTestsFinished.handleTestsFinished(2, 1, 0, 0, 3, 3000, '')
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(
    '\n\u001B[1mTest Suites:\u001B[22m \u001B[1m\u001B[31m1 failed\u001B[39m\u001B[22m, \u001B[1m\u001B[32m2 passed\u001B[39m\u001B[22m, 3 total\n' +
      '\u001B[1mTime:\u001B[22m        3.000 s\n' +
      '\u001B[2mRan all test suites.\u001B[22m\n' +
      '\n' +
      '\u001B[1mWatch Usage: \u001B[22m\u001B[2mPress \u001B[22mw\u001B[2m to show more.\u001B[22m',
  )
})

test('handleTestsFinished - with filter value', () => {
  HandleTestsFinished.handleTestsFinished(2, 1, 0, 0, 3, 3000, 'abc')
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(
    '\n\u001B[1mTest Suites:\u001B[22m \u001B[1m\u001B[31m1 failed\u001B[39m\u001B[22m, \u001B[1m\u001B[32m2 passed\u001B[39m\u001B[22m, 3 total\n' +
      '\u001B[1mTime:\u001B[22m        3.000 s\n' +
      '\u001B[2mRan all test suites matching\u001B[22m /abc/i\u001B[2m.\u001B[22m\n' +
      '\n' +
      '\u001B[1mWatch Usage: \u001B[22m\u001B[2mPress \u001B[22mw\u001B[2m to show more.\u001B[22m',
  )
})

test('handleTestsFinished - with leak', () => {
  HandleTestsFinished.handleTestsFinished(2, 1, 0, 1, 4, 3000, '')
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(
    '\n' +
      '\u001B[1mTest Suites:\u001B[22m \u001B[1m\u001B[31m1 failed\u001B[39m\u001B[22m, \u001B[1m\u001B[32m2 passed\u001B[39m\u001B[22m, \u001B[1m\u001B[34m1 leaked\u001B[39m\u001B[22m, 4 total\n' +
      '\u001B[1mTime:\u001B[22m        3.000 s\n' +
      '\u001B[2mRan all test suites.\u001B[22m\n' +
      '\n' +
      '\u001B[1mWatch Usage: \u001B[22m\u001B[2mPress \u001B[22mw\u001B[2m to show more.\u001B[22m',
  )
})
