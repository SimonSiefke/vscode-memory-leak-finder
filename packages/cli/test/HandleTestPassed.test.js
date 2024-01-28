import { jest } from '@jest/globals'

beforeEach(() => {
  jest.resetModules()
})

jest.unstable_mockModule('../src/parts/Stdout/Stdout.js', () => {
  return {
    write: jest.fn(),
  }
})

jest.unstable_mockModule('../src/parts/IsGithubActions/IsGithubActions.js', () => {
  return {
    isGithubActions: false,
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
    '\r\u001B[K\r\u001B[1A\r\u001B[K\r\u001B[1A\u001B[0m\u001B[7m\u001B[1m\u001B[32m PASS \u001B[39m\u001B[22m\u001B[27m\u001B[0m \u001B[2m/test/\u001B[22m\u001B[1mapp.test.js\u001B[22m (0.100 s)\n',
  )
  expect(TestStateOutput.clearPending).toHaveBeenCalledTimes(1)
})
