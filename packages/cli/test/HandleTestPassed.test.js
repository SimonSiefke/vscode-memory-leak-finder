import { jest } from '@jest/globals'

beforeEach(() => {
  jest.resetModules()
})

jest.unstable_mockModule('../src/parts/Stdout/Stdout.js', () => {
  return {
    write: jest.fn(),
  }
})

jest.unstable_mockModule('../src/parts/StdinDataState/StdinDataState.js', () => {
  return {
    isBuffering() {
      return true
    },
  }
})

jest.unstable_mockModule('../src/parts/TestStateOutput/TestStateOutput.js', () => {
  return {
    clearPending: jest.fn(() => {
      return ''
    }),
  }
})

const Stdout = await import('../src/parts/Stdout/Stdout.js')
const TestStateOutput = await import('../src/parts/TestStateOutput/TestStateOutput.js')
const HandleTestPassed = await import('../src/parts/HandleTestPassed/HandleTestPassed.js')

test('handleTestPassed', () => {
  HandleTestPassed.handleTestPassed('/test/app.test.js', '/test', 'app.test.js', 100)
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(
    '\r\x1B[K\r\x1B[1A\r\x1B[K\r\x1B[1A\x1B[0m\x1B[7m\x1B[1m\x1B[32m PASS \x1B[39m\x1B[22m\x1B[27m\x1B[0m \x1B[2m/test/\x1B[22m\x1B[1mapp.test.js\x1B[22m (0.100 s)\n'
  )
  expect(TestStateOutput.clearPending).toHaveBeenCalledTimes(1)
})
