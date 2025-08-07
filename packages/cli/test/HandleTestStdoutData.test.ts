import { beforeEach, expect, jest, test } from '@jest/globals'

beforeEach(() => {
  jest.resetModules()
})

jest.unstable_mockModule('../src/parts/TestStateOutput/TestStateOutput.ts', () => {
  return {
    addStdout: jest.fn(),
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
const HandleTestStdoutData = await import('../src/parts/HandleTestStdoutData/HandleTestStdoutData.ts')

test('handleStdoutData', () => {
  HandleTestStdoutData.handleStdoutData(Buffer.from('test'))
  expect(TestStateOutput.addStdout).toHaveBeenCalledTimes(1)
  expect(TestStateOutput.addStdout).toHaveBeenCalledWith(Buffer.from('test'))
})
