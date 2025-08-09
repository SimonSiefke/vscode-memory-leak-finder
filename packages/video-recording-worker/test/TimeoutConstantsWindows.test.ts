import { expect, test, jest } from '@jest/globals'

jest.mock('../src/parts/IsWindows/IsWindows.ts', () => ({
  IsWindows: true,
}))

import * as TimeoutConstants from '../src/parts/TimeoutConstants/TimeoutConstants.ts'

test('AttachToPage timeout for Windows platform', () => {
  expect(TimeoutConstants.AttachToPage).toBe(5000)
  expect(typeof TimeoutConstants.AttachToPage).toBe('number')
})

test('UtilityExecutionContext timeout for Windows platform', () => {
  expect(TimeoutConstants.UtilityExecutionContext).toBe(16000)
  expect(typeof TimeoutConstants.UtilityExecutionContext).toBe('number')
})
