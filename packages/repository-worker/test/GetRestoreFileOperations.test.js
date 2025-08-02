import { expect, test } from '@jest/globals'
import { getRestoreFileOperations } from '../src/parts/GetRestoreFileOperations/GetRestoreFileOperations.js'

test('getRestoreFileOperations handles errors gracefully', async () => {
  // Should not throw with invalid path
  const result = await getRestoreFileOperations(
    'test:///nonexistent/path',
    'cache-key',
    'test:///cache/dir',
    'test:///cache/dir/cache-key',
    [],
  )
  expect(Array.isArray(result)).toBe(true)
})
