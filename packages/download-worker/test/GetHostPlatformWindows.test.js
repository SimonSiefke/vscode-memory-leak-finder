import { expect, test } from '@jest/globals'
import * as GetHostPlatformWindows from '../src/parts/GetHostPlatformWindows/GetHostPlatformWindows.js'

test('windows', async () => {
  expect(GetHostPlatformWindows.getHostPlatform()).toBe('win64')
})
