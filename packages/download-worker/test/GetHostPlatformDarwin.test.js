import { expect, jest, test } from '@jest/globals'

jest.unstable_mockModule('node:os', () => {
  return {
    release: jest.fn(),
    cpus: jest.fn(),
  }
})

const GetHostPlatformDarwin = await import('../src/parts/GetHostPlatformDarwin/GetHostPlatformDarwin.js')
const os = await import('node:os')

test('mac10.13', () => {
  jest.spyOn(os, 'release').mockReturnValue('1.19')
  expect(GetHostPlatformDarwin.getHostPlatform()).toBe('mac10.13')
})

test('mac10.14', () => {
  jest.spyOn(os, 'release').mockReturnValue('18.0')
  expect(GetHostPlatformDarwin.getHostPlatform()).toBe('mac10.14')
})

test('mac10.15', () => {
  jest.spyOn(os, 'release').mockReturnValue('19.0')
  expect(GetHostPlatformDarwin.getHostPlatform()).toBe('mac10.15')
})

test('mac11', () => {
  jest.spyOn(os, 'release').mockReturnValue('20.0')
  jest.spyOn(os, 'cpus').mockReturnValue([])
  expect(GetHostPlatformDarwin.getHostPlatform()).toBe('mac11')
})

test('mac11-arm', () => {
  jest.spyOn(os, 'release').mockReturnValue('20.0')
  jest.spyOn(os, 'cpus').mockReturnValue([{ model: 'Apple', speed: 0, times: { user: 0, idle: 0, irq: 0, nice: 0, sys: 0 } }])
  expect(GetHostPlatformDarwin.getHostPlatform()).toBe('mac11-arm64')
})
