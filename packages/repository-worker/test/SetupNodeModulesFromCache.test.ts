import { expect, test, jest } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import * as FileSystemWorker from '../src/parts/FileSystemWorker/FileSystemWorker.ts'
import { copyNodeModulesFromCacheToFolder } from '../src/parts/SetupNodeModulesFromCache/SetupNodeModulesFromCache.ts'

test('setupNodeModulesFromCache throws VError when no cache exists', async () => {
  const mockInvoke = jest.fn()
  mockInvoke.mockImplementation(() => {
    throw new Error('ENOENT: no such file or directory')
  })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  await expect(copyNodeModulesFromCacheToFolder('/nonexistent/path', 'test-commit', '/test/cache')).rejects.toThrow(
    'Failed to setup node_modules from cache',
  )
  expect(mockInvoke).toHaveBeenCalled()
})
