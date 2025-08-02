import { test, expect } from '@jest/globals'
import { getRestoreFileOperations } from '../src/parts/GetRestoreFileOperations/GetRestoreFileOperations.js'
import { pathToFileURL } from 'node:url'

test('getRestoreFileOperations - function exists and is callable', async () => {
  expect(typeof getRestoreFileOperations).toBe('function')
})

test('getRestoreFileOperations - function signature is correct', async () => {
  const fn = getRestoreFileOperations
  expect(fn.length).toBe(5) // Should accept 5 parameters
})

test('getRestoreFileOperations handles errors gracefully', async () => {
  // Should not throw with invalid path
  const result = await getRestoreFileOperations(
    pathToFileURL('/nonexistent/path').href,
    'cache-key',
    pathToFileURL('/cache/dir').href,
    pathToFileURL('/cache/dir/cache-key').href,
    []
  )
  expect(Array.isArray(result)).toBe(true)
})