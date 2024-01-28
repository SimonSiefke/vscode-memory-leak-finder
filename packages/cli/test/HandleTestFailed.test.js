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
const HandleTestFailed = await import('../src/parts/HandleTestFailed/HandleTestFailed.js')

test('handleTestFailed', () => {
  const file = '/test/e2e/src/sample.close-window.js'
  const relativeDirName = 'src'
  const releativeFilePath = `src/sample.close-window.js`
  const fileName = 'sample.close-window.js'
  const error = {
    type: 'Error',
    message: 'expected window count to be 0 but was 1',
    stack: '    at Module.test (/test/e2e/src/sample.close-window.js:15:29)',
    codeFrame:
      '\u001B[0m \u001B[90m 13 |\u001B[39m   \u001B[36mconst\u001B[39m window \u001B[33m=\u001B[39m \u001B[36mawait\u001B[39m electronApp\u001B[33m.\u001B[39mfirstWindow()\u001B[0m\n' +
      '\u001B[0m \u001B[90m 14 |\u001B[39m   \u001B[36mawait\u001B[39m window\u001B[33m.\u001B[39mclose()\u001B[0m\n' +
      '\u001B[0m\u001B[31m\u001B[1m>\u001B[22m\u001B[39m\u001B[90m 15 |\u001B[39m   \u001B[36mawait\u001B[39m expect(electronApp)\u001B[33m.\u001B[39mtoHaveWindowCount(\u001B[35m0\u001B[39m)\u001B[0m\n' +
      '\u001B[0m \u001B[90m    |\u001B[39m                             \u001B[31m\u001B[1m^\u001B[22m\u001B[39m\u001B[0m\n' +
      '\u001B[0m \u001B[90m 16 |\u001B[39m }\u001B[0m\n' +
      '\u001B[0m \u001B[90m 17 |\u001B[39m\u001B[0m',
  }
  HandleTestFailed.handleTestFailed(file, relativeDirName, releativeFilePath, fileName, error)
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(
    '\r\u001B[K\r\u001B[1A\r\u001B[K\r\u001B[1A\u001B[0m\u001B[7m\u001B[1m\u001B[31m FAIL \u001B[39m\u001B[22m\u001B[27m\u001B[0m \u001B[2msrc/\u001B[22m\u001B[1msample.close-window.js\u001B[22m\n' +
      '\n' +
      '      Error: expected window count to be 0 but was 1\n' +
      '\n' +
      '    \u001B[0m \u001B[90m 13 |\u001B[39m   \u001B[36mconst\u001B[39m window \u001B[33m=\u001B[39m \u001B[36mawait\u001B[39m electronApp\u001B[33m.\u001B[39mfirstWindow()\u001B[0m\n' +
      '    \u001B[0m \u001B[90m 14 |\u001B[39m   \u001B[36mawait\u001B[39m window\u001B[33m.\u001B[39mclose()\u001B[0m\n' +
      '    \u001B[0m\u001B[31m\u001B[1m>\u001B[22m\u001B[39m\u001B[90m 15 |\u001B[39m   \u001B[36mawait\u001B[39m expect(electronApp)\u001B[33m.\u001B[39mtoHaveWindowCount(\u001B[35m0\u001B[39m)\u001B[0m\n' +
      '    \u001B[0m \u001B[90m    |\u001B[39m                             \u001B[31m\u001B[1m^\u001B[22m\u001B[39m\u001B[0m\n' +
      '    \u001B[0m \u001B[90m 16 |\u001B[39m }\u001B[0m\n' +
      '    \u001B[0m \u001B[90m 17 |\u001B[39m\u001B[0m\n' +
      '\n' +
      '   \u001B[2m    at Module.test (\u001B[22m/test/e2e/src/sample.close-window.js\u001B[2m:15:29)\u001B[22m\n' +
      '\n',
  )
  expect(TestStateOutput.clearPending).toHaveBeenCalledTimes(1)
})
