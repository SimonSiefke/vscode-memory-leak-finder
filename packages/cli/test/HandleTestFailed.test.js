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
const HandleTestFailed = await import('../src/parts/HandleTestFailed/HandleTestFailed.js')

test('handleTestFailed', () => {
  const file = '/test/e2e/src/sample.close-window.js'
  const relativeDirName = 'src'
  const releativeFilePath = `src/sample.close-window.js`
  const fileName = 'sample.close-window.js'
  const error = {
    message: 'expected window count to be 0 but was 1',
    stack: '    at Module.test (/test/e2e/src/sample.close-window.js:15:29)',
    codeFrame:
      '\x1B[0m \x1B[90m 13 |\x1B[39m   \x1B[36mconst\x1B[39m window \x1B[33m=\x1B[39m \x1B[36mawait\x1B[39m electronApp\x1B[33m.\x1B[39mfirstWindow()\x1B[0m\n' +
      '\x1B[0m \x1B[90m 14 |\x1B[39m   \x1B[36mawait\x1B[39m window\x1B[33m.\x1B[39mclose()\x1B[0m\n' +
      '\x1B[0m\x1B[31m\x1B[1m>\x1B[22m\x1B[39m\x1B[90m 15 |\x1B[39m   \x1B[36mawait\x1B[39m expect(electronApp)\x1B[33m.\x1B[39mtoHaveWindowCount(\x1B[35m0\x1B[39m)\x1B[0m\n' +
      '\x1B[0m \x1B[90m    |\x1B[39m                             \x1B[31m\x1B[1m^\x1B[22m\x1B[39m\x1B[0m\n' +
      '\x1B[0m \x1B[90m 16 |\x1B[39m }\x1B[0m\n' +
      '\x1B[0m \x1B[90m 17 |\x1B[39m\x1B[0m',
  }
  HandleTestFailed.handleTestFailed(file, relativeDirName, releativeFilePath, fileName, error)
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith(
    '\r\x1B[K\r\x1B[1A\r\x1B[K\r\x1B[1A\x1B[0m\x1B[7m\x1B[1m\x1B[31m FAIL \x1B[39m\x1B[22m\x1B[27m\x1B[0m \x1B[2msrc/\x1B[22m\x1B[1msample.close-window.js\x1B[22m\n' +
      '\n' +
      '      expected window count to be 0 but was 1\n' +
      '\n' +
      '    \x1B[0m \x1B[90m 13 |\x1B[39m   \x1B[36mconst\x1B[39m window \x1B[33m=\x1B[39m \x1B[36mawait\x1B[39m electronApp\x1B[33m.\x1B[39mfirstWindow()\x1B[0m\n' +
      '    \x1B[0m \x1B[90m 14 |\x1B[39m   \x1B[36mawait\x1B[39m window\x1B[33m.\x1B[39mclose()\x1B[0m\n' +
      '    \x1B[0m\x1B[31m\x1B[1m>\x1B[22m\x1B[39m\x1B[90m 15 |\x1B[39m   \x1B[36mawait\x1B[39m expect(electronApp)\x1B[33m.\x1B[39mtoHaveWindowCount(\x1B[35m0\x1B[39m)\x1B[0m\n' +
      '    \x1B[0m \x1B[90m    |\x1B[39m                             \x1B[31m\x1B[1m^\x1B[22m\x1B[39m\x1B[0m\n' +
      '    \x1B[0m \x1B[90m 16 |\x1B[39m }\x1B[0m\n' +
      '    \x1B[0m \x1B[90m 17 |\x1B[39m\x1B[0m\n' +
      '\n' +
      '   \x1B[2m    at Module.test (\x1B[22m/test/e2e/src/sample.close-window.js\x1B[2m:15:29)\x1B[22m\n' +
      '\n'
  )
  expect(TestStateOutput.clearPending).toHaveBeenCalledTimes(1)
})
