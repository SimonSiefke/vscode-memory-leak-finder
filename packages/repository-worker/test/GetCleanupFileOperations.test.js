import { expect, test } from '@jest/globals'
import { getCleanupFileOperations } from '../src/parts/GetCleanupFileOperations/GetCleanupFileOperations.js'

test('getCleanupFileOperations handles errors gracefully', async () => {
  // Should not throw with invalid path
  const result = getCleanupFileOperations('test:///nonexistent/path')
  expect(Array.isArray(result)).toBe(true)
})
