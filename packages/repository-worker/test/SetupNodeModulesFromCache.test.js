import { expect, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import * as FileSystemWorker from '../src/parts/FileSystemWorker/FileSystemWorker.js'
import { setupNodeModulesFromCache } from '../src/parts/SetupNodeModulesFromCache/SetupNodeModulesFromCache.js'

test('setupNodeModulesFromCache throws VError when no cache exists', async () => {
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method) => {
      if (method === 'FileSystem.findFiles') {
        throw new Error('ENOENT: no such file or directory')
      }
      throw new Error(`unexpected method ${method}`)
    },
  })
  FileSystemWorker.set(mockRpc)

  await expect(setupNodeModulesFromCache('/nonexistent/path', 'test-commit', '/test/cache')).rejects.toThrow(
    'Failed to setup node_modules from cache',
  )
})
