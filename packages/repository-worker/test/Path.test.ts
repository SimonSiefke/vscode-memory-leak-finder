import { expect, test } from '@jest/globals'
import { join } from '../src/parts/Path/Path.ts'

test.skip('join combines path segments correctly', () => {
  const result = join('path', 'to', 'file')
  expect(result).toBe('path/to/file')
})

test('join handles single path segment', () => {
  const result = join('path')
  expect(result).toBe('path')
})

test.skip('join handles empty path segments', () => {
  const result = join('path', '', 'file')
  expect(result).toBe('path/file')
})

test.skip('join handles absolute paths', () => {
  const result = join('/absolute', 'path', 'file')
  expect(result).toBe('/absolute/path/file')
})

test.skip('join handles multiple path segments', () => {
  const result = join('a', 'b', 'c', 'd', 'e')
  expect(result).toBe('a/b/c/d/e')
})

test.skip('join handles path with dots', () => {
  const result = join('path', '.', 'file')
  expect(result).toBe('path/file')
})

test.skip('join handles path with parent directory', () => {
  const result = join('path', '..', 'file')
  expect(result).toBe('file')
})
