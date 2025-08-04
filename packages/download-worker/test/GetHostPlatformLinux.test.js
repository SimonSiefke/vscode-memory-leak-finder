import { expect, test, jest } from '@jest/globals'

const getLinuxDistributionInfo = jest.fn(async () => {
  return { id: '', version: '' }
})

jest.unstable_mockModule('../src/parts/GetLinuxDistributionInfo/GetLinuxDistributionInfo.js', () => {
  return {
    getLinuxDistributionInfo: jest.fn(),
  }
})

const arch = jest.fn(() => '')

jest.unstable_mockModule('node:os', () => {
  return {
    arch: jest.fn(),
  }
})

const GetHostPlatformLinux = await import('../src/parts/GetHostPlatformLinux/GetHostPlatformLinux.js')

test.skip('ubuntu 18.04 - x64', async () => {
  getLinuxDistributionInfo.mockResolvedValue({
    id: 'ubuntu',
    version: '18',
  })
  arch.mockReturnValue('x64')
  expect(await GetHostPlatformLinux.getHostPlatform()).toBe('ubuntu18.04-x64')
})

test.skip('ubuntu 18.04 - arm64', async () => {
  getLinuxDistributionInfo.mockResolvedValue({
    id: 'ubuntu',
    version: '18',
  })
  arch.mockReturnValue('arm64')
  expect(await GetHostPlatformLinux.getHostPlatform()).toBe('ubuntu18.04-arm64')
})

test.skip('ubuntu 20.04 - x64', async () => {
  getLinuxDistributionInfo.mockResolvedValue({
    id: 'ubuntu',
    version: '20',
  })
  arch.mockReturnValue('x64')
  expect(await GetHostPlatformLinux.getHostPlatform()).toBe('ubuntu20.04-x64')
})

test.skip('ubuntu 20.04 - arm64', async () => {
  getLinuxDistributionInfo.mockResolvedValue({
    id: 'ubuntu',
    version: '20',
  })
  arch.mockReturnValue('arm64')
  expect(await GetHostPlatformLinux.getHostPlatform()).toBe('ubuntu20.04-arm64')
})

test.skip('ubuntu 22.04 - x64', async () => {
  getLinuxDistributionInfo.mockResolvedValue({
    id: 'ubuntu',
    version: '22',
  })
  arch.mockReturnValue('x64')
  expect(await GetHostPlatformLinux.getHostPlatform()).toBe('ubuntu22.04-x64')
})

test.skip('ubuntu 22.04 - arm64', async () => {
  getLinuxDistributionInfo.mockResolvedValue({
    id: 'ubuntu',
    version: '22',
  })
  arch.mockReturnValue('arm64')
  expect(await GetHostPlatformLinux.getHostPlatform()).toBe('ubuntu22.04-arm64')
})

test.skip('ubuntu 24.04 - x64', async () => {
  getLinuxDistributionInfo.mockResolvedValue({
    id: 'ubuntu',
    version: '24',
  })
  arch.mockReturnValue('x64')
  expect(await GetHostPlatformLinux.getHostPlatform()).toBe('ubuntu24.04-x64')
})

test.skip('ubuntu 24.04 - arm64', async () => {
  getLinuxDistributionInfo.mockResolvedValue({
    id: 'ubuntu',
    version: '24',
  })
  arch.mockReturnValue('arm64')
  expect(await GetHostPlatformLinux.getHostPlatform()).toBe('ubuntu24.04-arm64')
})

test.skip('debian 11 - x64', async () => {
  getLinuxDistributionInfo.mockResolvedValue({
    id: 'debian',
    version: '11',
  })
  arch.mockReturnValue('x64')
  expect(await GetHostPlatformLinux.getHostPlatform()).toBe('debian11-x64')
})

test.skip('debian 12 - x64', async () => {
  getLinuxDistributionInfo.mockResolvedValue({
    id: 'debian',
    version: '12',
  })
  arch.mockReturnValue('x64')
  expect(await GetHostPlatformLinux.getHostPlatform()).toBe('debian12-x64')
})

test.skip('generic linux - x64', async () => {
  getLinuxDistributionInfo.mockResolvedValue({
    id: 'other',
    version: '1',
  })
  arch.mockReturnValue('x64')
  expect(await GetHostPlatformLinux.getHostPlatform()).toBe('generic-linux-x64')
})
