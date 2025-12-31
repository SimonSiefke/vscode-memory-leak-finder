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

test('linux platform', () => {
  const path = '/path/to/code'
  const result = GetProductJsonPath.getProductJsonPath('linux', path)
  const expected = resolve(path, '..', 'resources', 'app', 'product.json')
  expect(result).toBe(expected)
})
