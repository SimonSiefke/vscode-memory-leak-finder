import { test, expect } from '@jest/globals'
import * as GetVscodePlatformName from '../src/parts/GetVscodePlatformName/GetVscodePlatformName.ts'

test.skip('getVscodePlatformName - linux x64', () => {
  expect(GetVscodePlatformName.getVscodePlatformName('linux', 'x64')).toBe('linux-x64')
})

test.skip('getVscodePlatformName - linux arm64', () => {
  expect(GetVscodePlatformName.getVscodePlatformName('linux', 'arm64')).toBe('linux-arm64')
})

test.skip('getVscodePlatformName - linux aarch64', () => {
  expect(GetVscodePlatformName.getVscodePlatformName('linux', 'aarch64')).toBe('linux-arm64')
})

test.skip('getVscodePlatformName - darwin x64', () => {
  expect(GetVscodePlatformName.getVscodePlatformName('darwin', 'x64')).toBe('darwin-x64')
})

test.skip('getVscodePlatformName - darwin arm64', () => {
  expect(GetVscodePlatformName.getVscodePlatformName('darwin', 'arm64')).toBe('darwin-arm64')
})

test.skip('getVscodePlatformName - darwin aarch64', () => {
  expect(GetVscodePlatformName.getVscodePlatformName('darwin', 'aarch64')).toBe('darwin-arm64')
})

test.skip('getVscodePlatformName - win32 x64', () => {
  expect(GetVscodePlatformName.getVscodePlatformName('win32', 'x64')).toBe('win32-x64')
})

test.skip('getVscodePlatformName - win32 arm64', () => {
  expect(GetVscodePlatformName.getVscodePlatformName('win32', 'arm64')).toBe('win32-arm64')
})

test.skip('getVscodePlatformName - win32 aarch64', () => {
  expect(GetVscodePlatformName.getVscodePlatformName('win32', 'aarch64')).toBe('win32-arm64')
})

test.skip('getVscodePlatformName - win32 ia32', () => {
  expect(GetVscodePlatformName.getVscodePlatformName('win32', 'ia32')).toBe('win32-ia32')
})

test.skip('getVscodePlatformName - win32 x32', () => {
  expect(GetVscodePlatformName.getVscodePlatformName('win32', 'x32')).toBe('win32-ia32')
})

test.skip('getVscodePlatformName - unsupported platform throws error', () => {
  expect(() => {
    GetVscodePlatformName.getVscodePlatformName('unsupported', 'x64')
  }).toThrow('Unsupported platform: unsupported')
})

test.skip('getVscodePlatformName - linux with other arch defaults to x64', () => {
  expect(GetVscodePlatformName.getVscodePlatformName('linux', 'ppc64')).toBe('linux-x64')
})

test.skip('getVscodePlatformName - darwin with other arch defaults to x64', () => {
  expect(GetVscodePlatformName.getVscodePlatformName('darwin', 'ppc64')).toBe('darwin-x64')
})

test.skip('getVscodePlatformName - win32 with other arch defaults to x64', () => {
  expect(GetVscodePlatformName.getVscodePlatformName('win32', 'ppc64')).toBe('win32-x64')
})
