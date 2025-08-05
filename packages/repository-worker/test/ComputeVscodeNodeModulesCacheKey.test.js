import { pathToFileURL } from 'node:url'
import { test, expect } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import * as FileSystemWorker from '../src/parts/FileSystemWorker/FileSystemWorker.js'
import { computeVscodeNodeModulesCacheKey } from '../src/parts/ComputeVscodeNodeModulesCacheKey/ComputeVscodeNodeModulesCacheKey.js'

test('computeVscodeNodeModulesCacheKey - returns a string', async () => {
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method) => {
      if (method === 'FileSystem.findFiles') {
        return ['package-lock.json']
      }
      throw new Error(`unexpected method ${method}`)
    },
  })
  FileSystemWorker.set(mockRpc)

  const result = await computeVscodeNodeModulesCacheKey(pathToFileURL('/nonexistent/path').href)
  expect(typeof result).toBe('string')
  expect(result.length).toBeGreaterThan(0)
})

test('computeVscodeNodeModulesCacheKey - handles errors gracefully', async () => {
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method) => {
      if (method === 'FileSystem.findFiles') {
        throw new Error('File not found')
      }
      throw new Error(`unexpected method ${method}`)
    },
  })
  FileSystemWorker.set(mockRpc)

  // Should not throw with invalid path
  await computeVscodeNodeModulesCacheKey(pathToFileURL('/nonexistent/path').href)
})
