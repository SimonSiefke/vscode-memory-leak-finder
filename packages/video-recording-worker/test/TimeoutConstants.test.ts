import { expect, test } from '@jest/globals'
import * as TimeoutConstants from '../src/parts/TimeoutConstants/TimeoutConstants.ts'

test('AttachToPage timeout is correct for platform', () => {
  const expectedTimeout = process.platform === 'win32' ? 5000 : 4000
  expect(TimeoutConstants.AttachToPage).toBe(expectedTimeout)
  expect(typeof TimeoutConstants.AttachToPage).toBe('number')
})

test('DefaultExecutionContext', () => {
  expect(TimeoutConstants.DefaultExecutionContext).toBe(500)
  expect(typeof TimeoutConstants.DefaultExecutionContext).toBe('number')
})

test('PageEvent', () => {
  expect(TimeoutConstants.PageEvent).toBe(2000)
  expect(typeof TimeoutConstants.PageEvent).toBe('number')
})

test('SessionState', () => {
  expect(TimeoutConstants.SessionState).toBe(500)
  expect(typeof TimeoutConstants.SessionState).toBe('number')
})

test('Target', () => {
  expect(TimeoutConstants.Target).toBe(8000)
  expect(typeof TimeoutConstants.Target).toBe('number')
})

test('UtilityExecutionContext timeout is correct for platform', () => {
  const expectedTimeout = process.platform === 'win32' ? 16000 : 8500
  expect(TimeoutConstants.UtilityExecutionContext).toBe(expectedTimeout)
  expect(typeof TimeoutConstants.UtilityExecutionContext).toBe('number')
})

test('WaitForDebuggerToBePaused', () => {
  expect(TimeoutConstants.WaitForDebuggerToBePaused).toBe(1000)
  expect(typeof TimeoutConstants.WaitForDebuggerToBePaused).toBe('number')
})
