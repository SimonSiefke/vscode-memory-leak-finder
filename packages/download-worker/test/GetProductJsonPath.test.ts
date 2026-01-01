import { expect, test } from '@jest/globals'
import { resolve } from 'node:path'
import * as GetProductJsonPath from '../src/parts/GetProductJsonPath/GetProductJsonPath.ts'

test('darwin platform', () => {
  const path = '/path/to/Electron'
  const result = GetProductJsonPath.getProductJsonPath('darwin', path)
  const expected = resolve(path, '..', '..', 'Resources', 'app', 'product.json')
  expect(result).toBe(expected)
})

test('win32 platform', () => {
  const path = '/path/to/Code.exe'
  const result = GetProductJsonPath.getProductJsonPath('win32', path)
  const expected = resolve(path, '..', 'resources', 'app', 'product.json')
  expect(result).toBe(expected)
})

test('win32 platform with commit', () => {
  const path = '/path/to/Code.exe'
  const commit = 'd0bba70758d220b36efa0edb7c9088b4b34c9370'
  const result = GetProductJsonPath.getProductJsonPath('win32', path, commit)
  const expected = resolve(path, '..', 'resources', 'd0bba70758', 'app', 'product.json')
  expect(result).toBe(expected)
})

test('linux platform', () => {
  const path = '/path/to/code'
  const result = GetProductJsonPath.getProductJsonPath('linux', path)
  const expected = resolve(path, '..', 'resources', 'app', 'product.json')
  expect(result).toBe(expected)
})
