import { expect, test, jest } from '@jest/globals'
import * as GetHostPlatformLinux from '../src/parts/GetHostPlatformLinux/GetHostPlatformLinux.js'

jest.unstable_mockModule('../src/parts/GetLinuxDistributionInfo/GetLinuxDistributionInfo.js', () => {
  return {
    id: 'ubuntu',
    version: '18',
  }
})

jest.unstable_mockModule('node:os', () => {
  return {
    arch() {
      return 'x64'
    },
  }
})

test('ubuntu 18.04', async () => {
  expect(await GetHostPlatformLinux.getHostPlatform()).toBe('')
})
