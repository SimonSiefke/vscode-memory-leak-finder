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

const Stdout = await import('../src/parts/Stdout/Stdout.js')
const HandleTestRunning = await import('../src/parts/HandleTestRunning/HandleTestRunning.js')

test.skip('handleTestRunning - first', () => {
  HandleTestRunning.handleTestRunning('/test/app.test.js', '/test', 'app.test.js', /* isFirst */ true)
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(
    '\u001B[0m\u001B[7m\u001B[33m\u001B[1m RUNS \u001B[22m\u001B[39m\u001B[27m\u001B[0m \u001B[2m/test/\u001B[22m\u001B[1mapp.test.js\u001B[22m\n',
  )
})

test('handleTestRunning - second', () => {
  HandleTestRunning.handleTestRunning('/test/app.test.js', '/test', 'app.test.js', /* isFirst */ false)
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(
    '\n' + '\u001B[0m\u001B[7m\u001B[33m\u001B[1m RUNS \u001B[22m\u001B[39m\u001B[27m\u001B[0m \u001B[2m/test/\u001B[22m\u001B[1mapp.test.js\u001B[22m\n',
  )
})
