import { expect, test } from '@jest/globals'
import * as GetHostPlatformWindows from '../src/parts/GetHostPlatformWindows/GetHostPlatformWindows.ts'

test('windows', async () => {
  expect(GetHostPlatformWindows.getHostPlatform()).toBe('win64')
})
