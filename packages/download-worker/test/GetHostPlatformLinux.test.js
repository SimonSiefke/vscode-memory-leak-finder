import { expect, test } from '@jest/globals'
import * as GetHostPlatformLinux from '../src/parts/GetHostPlatformLinux/GetHostPlatformLinux.js'

test.skip('linux', async () => {
  expect(GetHostPlatformLinux.getHostPlatform()).toBe('')
})
