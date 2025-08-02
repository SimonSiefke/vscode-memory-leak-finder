import { test, expect } from '@jest/globals'

test('getRestoreFileOperations - function exists and is callable', async () => {
  const { getRestoreFileOperations } = await import('../src/parts/GetRestoreFileOperations/GetRestoreFileOperations.js')
  expect(typeof getRestoreFileOperations).toBe('function')
})

test('getRestoreFileOperations - function signature is correct', async () => {
  const { getRestoreFileOperations } = await import('../src/parts/GetRestoreFileOperations/GetRestoreFileOperations.js')
  const fn = getRestoreFileOperations
  expect(fn.length).toBe(1) // Should accept one parameter (repoPath)
})

test('getRestoreFileOperations handles errors gracefully', async () => {
  const { getRestoreFileOperations } = await import('../src/parts/GetRestoreFileOperations/GetRestoreFileOperations.js')

  // Should not throw with invalid path
  const result = await getRestoreFileOperations('/nonexistent/path')
  expect(Array.isArray(result)).toBe(true)
})