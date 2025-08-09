import { expect, test } from '@jest/globals'
import * as GetExecutablePathKey from '../src/parts/GetExecutablePathKey/GetExecutablePathKey.ts'

test('getExecutablePathKey returns correct key for linux', () => {
  expect(GetExecutablePathKey.getExecutablePathKey('linux')).toBe('linux')
})

test('getExecutablePathKey returns correct key for darwin', () => {
  expect(GetExecutablePathKey.getExecutablePathKey('darwin')).toBe('mac')
})

test('getExecutablePathKey returns correct key for win32', () => {
  expect(GetExecutablePathKey.getExecutablePathKey('win32')).toBe('win')
})

test('getExecutablePathKey returns empty string for unknown platform', () => {
  expect(GetExecutablePathKey.getExecutablePathKey('unknown')).toBe('')
  expect(GetExecutablePathKey.getExecutablePathKey('freebsd')).toBe('')
  expect(GetExecutablePathKey.getExecutablePathKey('')).toBe('')
})
