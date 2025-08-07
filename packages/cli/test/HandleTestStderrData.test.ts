import { beforeEach, expect, jest, test } from '@jest/globals'

beforeEach(() => {
  jest.resetModules()
})

jest.unstable_mockModule('../src/parts/TestStateOutput/TestStateOutput.js', () => {
  return {
    addStdErr: jest.fn(),
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
const HandleTestStderrData = await import('../src/parts/HandleTestStderrData/HandleTestStderrData.js')

test('handleStderrData', () => {
  HandleTestStderrData.handleStderrData(Buffer.from('test'))
  expect(TestStateOutput.addStdErr).toHaveBeenCalledTimes(1)
  expect(TestStateOutput.addStdErr).toHaveBeenCalledWith(Buffer.from('test'))
})
