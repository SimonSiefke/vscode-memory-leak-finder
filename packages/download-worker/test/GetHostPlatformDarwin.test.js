import { expect, jest, test } from '@jest/globals'

jest.unstable_mockModule('node:os', () => {
  return {
    release() {
      return '1.19'
    },
  }
})

const GetHostPlatformDarwin = await import('../src/parts/GetHostPlatformDarwin/GetHostPlatformDarwin.js')

test('mac10.13', () => {
  expect(GetHostPlatformDarwin.getHostPlatform()).toBe('mac10.13')
})
