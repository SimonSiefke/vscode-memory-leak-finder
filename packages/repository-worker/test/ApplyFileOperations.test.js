import { test, expect } from '@jest/globals'
import { applyFileOperations } from '../src/parts/ApplyFileOperations/ApplyFileOperations.js'

test('applyFileOperations - function exists and is callable', async () => {
  expect(typeof applyFileOperations).toBe('function')
})

test('applyFileOperations handles empty array gracefully', async () => {
  // Should not throw with empty array
  await applyFileOperations([])
})
