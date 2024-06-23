import { expect, test, jest } from '@jest/globals'

jest.unstable_mockModule('../src/parts/GetLinuxDistributionInfo/GetLinuxDistributionInfo.js', () => {
  return {
    getLinuxDistributionInfo: jest.fn(),
  }
})

jest.unstable_mockModule('node:os', () => {
  return {
    arch: jest.fn(),
  }
})

const GetLinuxDistributionInfo = await import('../src/parts/GetLinuxDistributionInfo/GetLinuxDistributionInfo.js')
const GetHostPlatformLinux = await import('../src/parts/GetHostPlatformLinux/GetHostPlatformLinux.js')
const os = await import('node:os')

test('ubuntu 18.04 - x64', async () => {
  jest.spyOn(GetLinuxDistributionInfo, 'getLinuxDistributionInfo').mockResolvedValue({
    id: 'ubuntu',
    version: '18',
  })
  jest.spyOn(os, 'arch').mockReturnValue('x64')
  expect(await GetHostPlatformLinux.getHostPlatform()).toBe('ubuntu18.04')
})

test('ubuntu 18.04 - arm64', async () => {
  jest.spyOn(GetLinuxDistributionInfo, 'getLinuxDistributionInfo').mockResolvedValue({
    id: 'ubuntu',
    version: '18',
  })
  jest.spyOn(os, 'arch').mockReturnValue('arm64')
  expect(await GetHostPlatformLinux.getHostPlatform()).toBe('ubuntu18.04-arm64')
})
