import { test, expect } from '@jest/globals'

test('getCacheFileOperations - function exists and is callable', async () => {
  const { getCacheFileOperations } = await import('../src/parts/GetCacheFileOperations/GetCacheFileOperations.js')
  expect(typeof getCacheFileOperations).toBe('function')
})

test('getCacheFileOperations - function signature is correct', async () => {
  const { getCacheFileOperations } = await import('../src/parts/GetCacheFileOperations/GetCacheFileOperations.js')
  const fn = getCacheFileOperations
  expect(fn.length).toBe(1) // Should accept one parameter (repoPath)
})

test('getCacheFileOperations handles errors gracefully', async () => {
  const { getCacheFileOperations } = await import('../src/parts/GetCacheFileOperations/GetCacheFileOperations.js')

  // Should not throw with invalid path
  const result = await getCacheFileOperations('/nonexistent/path')
  expect(Array.isArray(result)).toBe(true)
})