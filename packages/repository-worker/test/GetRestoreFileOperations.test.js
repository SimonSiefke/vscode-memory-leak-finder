import { expect, test } from '@jest/globals'
import { getRestoreNodeModulesFileOperations } from '../src/parts/GetRestoreFileOperations/GetRestoreFileOperations.js'

test('getRestoreNodeModulesFileOperations returns empty array when no cached paths', async () => {
  // Should return empty array when no cached paths provided
  const result = await getRestoreNodeModulesFileOperations('/test/repo', 'cache-key', '/test/cache', '/test/cache/cache-key', [])
  expect(result).toEqual([])
})
