import { test, expect } from '@jest/globals'
import * as Character from '../src/parts/Character/Character.ts'
import * as TestOutputState from '../src/parts/TestOutputState/TestOutputState.ts'
import * as TestOutputType from '../src/parts/TestOutputType/TestOutputType.ts'
import * as TestStateOutput from '../src/parts/TestStateOutput/TestStateOutput.ts'

test('addStdout - adds stdout data to state', () => {
  TestOutputState.clear()
  const testData = Buffer.from('test stdout data')

  TestStateOutput.addStdout(testData)

  const pending = TestOutputState.getAll()
  expect(pending).toHaveLength(1)
  expect(pending[0]).toEqual({
    type: TestOutputType.Stdout,
    data: testData,
  })
})

test('addStdErr - adds stderr data to state', () => {
  TestOutputState.clear()
  const testData = Buffer.from('test stderr data')

  TestStateOutput.addStdErr(testData)

  const pending = TestOutputState.getAll()
  expect(pending).toHaveLength(1)
  expect(pending[0]).toEqual({
    type: TestOutputType.Stderr,
    data: testData,
  })
})

test('addStdout - uses correct output type', () => {
  TestOutputState.clear()
  const testData = Buffer.from('stdout')

  TestStateOutput.addStdout(testData)

  const pending = TestOutputState.getAll()
  expect(pending[0].type).toBe(TestOutputType.Stdout)
  expect(pending[0].type).toBe(1)
})

test('addStdErr - uses correct output type', () => {
  TestOutputState.clear()
  const testData = Buffer.from('stderr')

  TestStateOutput.addStdErr(testData)

  const pending = TestOutputState.getAll()
  expect(pending[0].type).toBe(TestOutputType.Stderr)
  expect(pending[0].type).toBe(2)
})

test('clearPending - returns empty string when no pending data', () => {
  TestOutputState.clear()

  const result = TestStateOutput.clearPending()

  expect(result).toBe(Character.EmptyString)
  expect(result).toBe('')
})

test('clearPending - returns concatenated buffer data as string', () => {
  TestOutputState.clear()
  const data1 = Buffer.from('hello ')
  const data2 = Buffer.from('world')

  TestStateOutput.addStdout(data1)
  TestStateOutput.addStdout(data2)

  const result = TestStateOutput.clearPending()

  expect(result).toBe('hello world')
})

test('clearPending - clears pending state after processing', () => {
  TestOutputState.clear()
  const testData = Buffer.from('test data')

  TestStateOutput.addStdout(testData)
  expect(TestOutputState.getAll()).toHaveLength(1)

  TestStateOutput.clearPending()

  expect(TestOutputState.getAll()).toHaveLength(0)
})

test('clearPending - handles mixed stdout and stderr data', () => {
  TestOutputState.clear()
  const stdoutData = Buffer.from('stdout: ')
  const stderrData = Buffer.from('stderr: ')
  const moreData = Buffer.from('end')

  TestStateOutput.addStdout(stdoutData)
  TestStateOutput.addStdErr(stderrData)
  TestStateOutput.addStdout(moreData)

  const result = TestStateOutput.clearPending()

  expect(result).toBe('stdout: stderr: end')
})

test('clearPending - handles empty buffers', () => {
  TestOutputState.clear()
  const emptyData = Buffer.from('')
  const normalData = Buffer.from('data')

  TestStateOutput.addStdout(emptyData)
  TestStateOutput.addStdout(normalData)

  const result = TestStateOutput.clearPending()

  expect(result).toBe('data')
})

test('multiple operations - can add and clear multiple times', () => {
  TestOutputState.clear()

  TestStateOutput.addStdout(Buffer.from('first'))
  let result = TestStateOutput.clearPending()
  expect(result).toBe('first')

  TestStateOutput.addStdErr(Buffer.from('second'))
  result = TestStateOutput.clearPending()
  expect(result).toBe('second')

  result = TestStateOutput.clearPending()
  expect(result).toBe('')
})
