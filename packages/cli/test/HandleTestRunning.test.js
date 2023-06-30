import { jest } from '@jest/globals'

beforeEach(() => {
  jest.resetModules()
})

jest.unstable_mockModule('../src/parts/Stdout/Stdout.js', () => {
  return {
    write: jest.fn(),
  }
})

const Stdout = await import('../src/parts/Stdout/Stdout.js')
const HandleTestRunning = await import('../src/parts/HandleTestRunning/HandleTestRunning.js')

test('handleTestRunning', () => {
  HandleTestRunning.handleTestRunning('/test/app.test.js', '/test', 'app.test.js')
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(
    '\x1B[0m\x1B[7m\x1B[33m\x1B[1m RUNS \x1B[22m\x1B[39m\x1B[27m\x1B[0m \x1B[2m/test/\x1B[22m\x1B[1mapp.test.js\x1B[22m\n'
  )
})
