import { test, expect } from '@jest/globals'

test('applyFileOperations - function exists and is callable', async () => {
  const { applyFileOperations } = await import('../src/parts/ApplyFileOperations/ApplyFileOperations.js')
  expect(typeof applyFileOperations).toBe('function')
})

test('applyFileOperations - function signature is correct', async () => {
  const { applyFileOperations } = await import('../src/parts/ApplyFileOperations/ApplyFileOperations.js')
  const fn = applyFileOperations
  expect(fn.length).toBe(1) // Should accept one parameter (fileOperations)
})

test('applyFileOperations handles empty array gracefully', async () => {
  const { applyFileOperations } = await import('../src/parts/ApplyFileOperations/ApplyFileOperations.js')

  // Should not throw with empty array
  await applyFileOperations([])
})