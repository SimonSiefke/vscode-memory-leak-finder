import { test, expect } from '@jest/globals'
import { getCleanupFileOperations } from '../src/parts/GetCleanupFileOperations/GetCleanupFileOperations.js'
import { pathToFileURL } from 'node:url'

test('getCleanupFileOperations - function exists and is callable', async () => {
  expect(typeof getCleanupFileOperations).toBe('function')
})

test('getCleanupFileOperations - function signature is correct', async () => {
  const fn = getCleanupFileOperations
  expect(fn.length).toBe(1) // Should accept one parameter (repoPathUri)
})

test('getCleanupFileOperations handles errors gracefully', async () => {
  // Should not throw with invalid path
  const result = getCleanupFileOperations(pathToFileURL('/nonexistent/path').href)
  expect(Array.isArray(result)).toBe(true)
})