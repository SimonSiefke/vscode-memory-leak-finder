import { expect, jest, test } from '@jest/globals'

// import '../src/parts/GetLinuxDistributionInfo/GetLinuxDistibutionInfo.js'

jest.unstable_mockModule('../src/parts/Unzip/Unzip.js', () => {
  return {
    fields: {
      id: 'ubuntu',
    },
  }
})

// jest.unstable_mockModule('../src/parts/GetLinuxDistributionInfo/GetLinuxDistributionInfo.js', () => {
//   return {
//     fields: {
//       id: 'ubuntu',
//     },
//   }
// })

const x = await import('../src/parts/GetLinuxDistributionInfo/GetLinuxDistibutionInfo.js')
const GetHostPlatformLinux = await import('../src/parts/GetHostPlatformLinux/GetHostPlatformLinux.js')

// const GetHostPlatformLinux = await import('../src/parts/GetHostPlatformLinux/GetHostPlatformLinux.js')

test('ubuntu 22.04 - x64', async () => {
  jest.spyOn(x, 'getLinuxDistributionInfo').mockImplementation(() => {})
  expect(await GetHostPlatformLinux.getHostPlatform()).toBe('ubuntu22.04')
})

test('ubuntu 24.04 - x64', async () => {
  expect(await GetHostPlatformLinux.getHostPlatform()).toBe('ubuntu24.04')
})
