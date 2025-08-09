import { pathToFileURL } from 'node:url'
import { test, expect, jest } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import * as FileSystemWorker from '../src/parts/FileSystemWorker/FileSystemWorker.js'
import { computeVscodeNodeModulesCacheKey } from '../src/parts/ComputeVscodeNodeModulesCacheKey/ComputeVscodeNodeModulesCacheKey.js'

test('computeVscodeNodeModulesCacheKey - returns a string', async () => {
  const mockInvoke = jest.fn()
  mockInvoke.mockImplementation((method) => {
    if (method === 'FileSystem.findFiles') {
      return ['package-lock.json']
    }
    if (method === 'FileSystem.readFileContent') {
      return 'mock package-lock content'
    }
    throw new Error(`unexpected method ${method}`)
  })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  const result = await computeVscodeNodeModulesCacheKey(pathToFileURL('/nonexistent/path').href)
  expect(typeof result).toBe('string')
  expect(result.length).toBeGreaterThan(0)
  expect(mockInvoke).toHaveBeenCalled()
})

test('computeVscodeNodeModulesCacheKey - handles errors gracefully', async () => {
  const mockInvoke = jest.fn()
  mockInvoke.mockImplementation(() => {
    throw new Error('File not found')
  })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  // Should throw a VError with proper error message
  await expect(computeVscodeNodeModulesCacheKey(pathToFileURL('/nonexistent/path').href)).rejects.toThrow(
    'Failed to compute VS Code node_modules cache key',
  )
  expect(mockInvoke).toHaveBeenCalled()
})
