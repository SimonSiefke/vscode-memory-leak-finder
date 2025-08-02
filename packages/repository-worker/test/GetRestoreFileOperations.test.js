import { expect, test } from '@jest/globals'
import { getRestoreNodeModulesFileOperations } from '../src/parts/GetRestoreFileOperations/GetRestoreFileOperations.js'

test('getRestoreNodeModulesFileOperations handles errors gracefully', async () => {
  // Should not throw with invalid path
  const result = await getRestoreNodeModulesFileOperations(
    'test:///nonexistent/path',
    'cache-key',
    'test:///cache/dir',
    'test:///cache/dir/cache-key',
    [],
  )
  expect(Array.isArray(result)).toBe(true)
})
