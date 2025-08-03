import { expect, test } from '@jest/globals'
import { join } from '../src/parts/Path/Path.js'

test('join combines path segments correctly', () => {
  const result = join('path', 'to', 'file')
  expect(result).toBe('path/to/file')
})

test('join handles single path segment', () => {
  const result = join('path')
  expect(result).toBe('path')
})

test('join handles empty path segments', () => {
  const result = join('path', '', 'file')
  expect(result).toBe('path/file')
})

test('join handles absolute paths', () => {
  const result = join('/absolute', 'path', 'file')
  expect(result).toBe('/absolute/path/file')
})

test('join handles multiple path segments', () => {
  const result = join('a', 'b', 'c', 'd', 'e')
  expect(result).toBe('a/b/c/d/e')
})

test('join handles path with dots', () => {
  const result = join('path', '.', 'file')
  expect(result).toBe('path/file')
})

test('join handles path with parent directory', () => {
  const result = join('path', '..', 'file')
  expect(result).toBe('file')
}) 