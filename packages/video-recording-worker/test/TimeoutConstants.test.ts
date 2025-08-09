import { expect, test, jest } from '@jest/globals'

jest.mock('../src/parts/IsWindows/IsWindows.ts', () => ({
  IsWindows: false,
}))

import * as TimeoutConstants from '../src/parts/TimeoutConstants/TimeoutConstants.ts'

test('AttachToPage timeout for non-Windows platform', () => {
  expect(TimeoutConstants.AttachToPage).toBe(4000)
  expect(typeof TimeoutConstants.AttachToPage).toBe('number')
})

test('UtilityExecutionContext timeout for non-Windows platform', () => {
  expect(TimeoutConstants.UtilityExecutionContext).toBe(8500)
  expect(typeof TimeoutConstants.UtilityExecutionContext).toBe('number')
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

test('WaitForDebuggerToBePaused', () => {
  expect(TimeoutConstants.WaitForDebuggerToBePaused).toBe(1000)
  expect(typeof TimeoutConstants.WaitForDebuggerToBePaused).toBe('number')
})
