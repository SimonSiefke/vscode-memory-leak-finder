import { test, expect } from '@jest/globals'

test('getCleanupFileOperations - function exists and is callable', async () => {
  const { getCleanupFileOperations } = await import('../src/parts/GetCleanupFileOperations/GetCleanupFileOperations.js')
  expect(typeof getCleanupFileOperations).toBe('function')
})

test('getCleanupFileOperations - function signature is correct', async () => {
  const { getCleanupFileOperations } = await import('../src/parts/GetCleanupFileOperations/GetCleanupFileOperations.js')
  const fn = getCleanupFileOperations
  expect(fn.length).toBe(1) // Should accept one parameter (repoPath)
})

test('getCleanupFileOperations handles errors gracefully', async () => {
  const { getCleanupFileOperations } = await import('../src/parts/GetCleanupFileOperations/GetCleanupFileOperations.js')

  // Should not throw with invalid path
  const result = getCleanupFileOperations('/nonexistent/path')
  expect(Array.isArray(result)).toBe(true)
})