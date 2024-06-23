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
  expect(await GetHostPlatformLinux.getHostPlatform()).toBe('ubuntu18.04-x64')
})

test('ubuntu 18.04 - arm64', async () => {
  jest.spyOn(GetLinuxDistributionInfo, 'getLinuxDistributionInfo').mockResolvedValue({
    id: 'ubuntu',
    version: '18',
  })
  jest.spyOn(os, 'arch').mockReturnValue('arm64')
  expect(await GetHostPlatformLinux.getHostPlatform()).toBe('ubuntu18.04-arm64')
})

test('ubuntu 20.04 - x64', async () => {
  jest.spyOn(GetLinuxDistributionInfo, 'getLinuxDistributionInfo').mockResolvedValue({
    id: 'ubuntu',
    version: '20',
  })
  jest.spyOn(os, 'arch').mockReturnValue('x64')
  expect(await GetHostPlatformLinux.getHostPlatform()).toBe('ubuntu20.04-x64')
})

test('ubuntu 20.04 - arm64', async () => {
  jest.spyOn(GetLinuxDistributionInfo, 'getLinuxDistributionInfo').mockResolvedValue({
    id: 'ubuntu',
    version: '20',
  })
  jest.spyOn(os, 'arch').mockReturnValue('arm64')
  expect(await GetHostPlatformLinux.getHostPlatform()).toBe('ubuntu20.04-arm64')
})

test('ubuntu 22.04 - x64', async () => {
  jest.spyOn(GetLinuxDistributionInfo, 'getLinuxDistributionInfo').mockResolvedValue({
    id: 'ubuntu',
    version: '22',
  })
  jest.spyOn(os, 'arch').mockReturnValue('x64')
  expect(await GetHostPlatformLinux.getHostPlatform()).toBe('ubuntu22.04-x64')
})

test('ubuntu 22.04 - arm64', async () => {
  jest.spyOn(GetLinuxDistributionInfo, 'getLinuxDistributionInfo').mockResolvedValue({
    id: 'ubuntu',
    version: '22',
  })
  jest.spyOn(os, 'arch').mockReturnValue('arm64')
  expect(await GetHostPlatformLinux.getHostPlatform()).toBe('ubuntu22.04-arm64')
})

test.skip('ubuntu 24.04 - x64', async () => {
  jest.spyOn(GetLinuxDistributionInfo, 'getLinuxDistributionInfo').mockResolvedValue({
    id: 'ubuntu',
    version: '24',
  })
  jest.spyOn(os, 'arch').mockReturnValue('x64')
  expect(await GetHostPlatformLinux.getHostPlatform()).toBe('ubuntu24.04-x64')
})

test.skip('ubuntu 24.04 - arm64', async () => {
  jest.spyOn(GetLinuxDistributionInfo, 'getLinuxDistributionInfo').mockResolvedValue({
    id: 'ubuntu',
    version: '24',
  })
  jest.spyOn(os, 'arch').mockReturnValue('arm64')
  expect(await GetHostPlatformLinux.getHostPlatform()).toBe('ubuntu24.04-arm64')
})

test('debian 11 - x64', async () => {
  jest.spyOn(GetLinuxDistributionInfo, 'getLinuxDistributionInfo').mockResolvedValue({
    id: 'debian',
    version: '11',
  })
  jest.spyOn(os, 'arch').mockReturnValue('x64')
  expect(await GetHostPlatformLinux.getHostPlatform()).toBe('debian11-x64')
})

test('debian 12 - x64', async () => {
  jest.spyOn(GetLinuxDistributionInfo, 'getLinuxDistributionInfo').mockResolvedValue({
    id: 'debian',
    version: '12',
  })
  jest.spyOn(os, 'arch').mockReturnValue('x64')
  expect(await GetHostPlatformLinux.getHostPlatform()).toBe('debian12-x64')
})

test('generic linux - x64', async () => {
  jest.spyOn(GetLinuxDistributionInfo, 'getLinuxDistributionInfo').mockResolvedValue({
    id: 'other',
    version: '1',
  })
  jest.spyOn(os, 'arch').mockReturnValue('x64')
  expect(await GetHostPlatformLinux.getHostPlatform()).toBe('generic-linux-x64')
})
