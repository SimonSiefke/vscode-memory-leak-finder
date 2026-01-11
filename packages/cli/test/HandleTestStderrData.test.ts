import { beforeEach, expect, jest, test } from '@jest/globals'

beforeEach(() => {
  jest.resetModules()
})

jest.unstable_mockModule('../src/parts/TestStateOutput/TestStateOutput.ts', () => {
  return {
    addStdErr: jest.fn(),
  }
})

jest.unstable_mockModule('../src/parts/StdinDataState/StdinDataState.ts', () => {
  return {
    isBuffering() {
      return true
    },
  }
})

const TestStateOutput = await import('../src/parts/TestStateOutput/TestStateOutput.ts')
const HandleTestStderrData = await import('../src/parts/HandleTestStderrData/HandleTestStderrData.ts')

test('handleStderrData', () => {
  HandleTestStderrData.handleStderrData(Buffer.from('test'))
  expect(TestStateOutput.addStdErr).toHaveBeenCalledTimes(1)
  expect(TestStateOutput.addStdErr).toHaveBeenCalledWith(Buffer.from('test'))
})
