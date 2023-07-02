import { jest } from '@jest/globals'

beforeEach(() => {
  jest.resetModules()
})

jest.unstable_mockModule('../src/parts/TestStateOutput/TestStateOutput.js', () => {
  return {
    addStdout: jest.fn(),
  }
})

jest.unstable_mockModule('../src/parts/StdinDataState/StdinDataState.js', () => {
  return {
    isBuffering() {
      return true
    },
  }
})

const TestStateOutput = await import('../src/parts/TestStateOutput/TestStateOutput.js')
const HandleTestStdoutData = await import('../src/parts/HandleTestStdoutData/HandleTestStdoutData.js')

test('handleStdoutData', () => {
  HandleTestStdoutData.handleStdoutData(Buffer.from('test'))
  expect(TestStateOutput.addStdout).toHaveBeenCalledTimes(1)
  expect(TestStateOutput.addStdout).toHaveBeenCalledWith(Buffer.from('test'))
})
