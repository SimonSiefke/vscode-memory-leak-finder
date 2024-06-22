import { expect, test } from '@jest/globals'
import * as GetExecutablePathKey from '../src/parts/GetExecutablePathKey/GetExecutablePathKey.js'

test('linux', () => {
  const platform = 'linux'
  expect(GetExecutablePathKey.getExecutablePathKey(platform)).toBe('linux')
})

test('darwin', () => {
  const platform = 'darwin'
  expect(GetExecutablePathKey.getExecutablePathKey(platform)).toBe('mac')
})

test('win32', () => {
  const platform = 'win32'
  expect(GetExecutablePathKey.getExecutablePathKey(platform)).toBe('win')
})

test('other', () => {
  const platform = 'abc'
  expect(GetExecutablePathKey.getExecutablePathKey(platform)).toBe('')
})
