import { expect, test } from '@jest/globals'
import { VError } from '@lvce-editor/verror'
import { getCleanupFileOperations } from '../src/parts/GetCleanupFileOperations/GetCleanupFileOperations.js'

test('getCleanupFileOperations throws VError when it fails', async () => {
  await expect(getCleanupFileOperations('test:///nonexistent/path')).rejects.toThrow(VError)
  await expect(getCleanupFileOperations('test:///nonexistent/path')).rejects.toThrow('Failed to get cleanup file operations for repository')
})
