import { expect, test } from '@jest/globals'
import { getRestoreNodeModulesFileOperations } from '../src/parts/GetRestoreFileOperations/GetRestoreFileOperations.js'

test('getRestoreNodeModulesFileOperations throws VError on errors', async () => {
  // Should throw VError with invalid path
  await expect(
    getRestoreNodeModulesFileOperations('test:///nonexistent/path', 'cache-key', 'test:///cache/dir', 'test:///cache/dir/cache-key', []),
  ).rejects.toThrow('Failed to get restore file operations')
})
