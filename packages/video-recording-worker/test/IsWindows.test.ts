import { expect, test } from '@jest/globals'
import * as IsWindows from '../src/parts/IsWindows/IsWindows.ts'

test('IsWindows', () => {
  expect(typeof IsWindows.IsWindows).toBe('boolean')
  expect(IsWindows.IsWindows).toBe(process.platform === 'win32')
})
