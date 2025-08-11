import { expect, jest, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import { VError } from '@lvce-editor/verror'
import { addNodeModulesToCache } from '../src/parts/CacheNodeModules/CacheNodeModules.ts'
import * as FileSystemWorker from '../src/parts/FileSystemWorker/FileSystemWorker.ts'

test.skip('addNodeModulesToCache - successfully caches node_modules', async () => {
  const mockNodeModulesPaths = ['node_modules', 'packages/a/node_modules', 'packages/b/node_modules']

  const mockInvoke = jest.fn()
  mockInvoke.mockImplementation((method) => {
    if (method === 'FileSystem.findFiles') {
      return mockNodeModulesPaths
    }
    if (method === 'FileSystem.applyFileOperations') {
      return undefined
    }
    throw new Error(`unexpected method ${method}`)
  })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  await addNodeModulesToCache('/repo/path', 'commit-hash', '/cache/dir')

  expect(mockInvoke).toHaveBeenCalled()
})

test.skip('addNodeModulesToCache - filters out nested node_modules and .git directories', async () => {
  const allNodeModulesPaths = [
    'node_modules',
    'packages/a/node_modules',
    'node_modules/node_modules', // Should be filtered out
    'packages/b/node_modules',
    '.git/node_modules', // Should be filtered out
    'packages/c/node_modules',
  ]

  const mockInvoke = jest.fn()
  mockInvoke.mockImplementation((method) => {
    if (method === 'FileSystem.findFiles') {
      return allNodeModulesPaths
    }
    if (method === 'FileSystem.applyFileOperations') {
      return undefined
    }
    throw new Error(`unexpected method ${method}`)
  })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  await addNodeModulesToCache('/repo/path', 'commit-hash', '/cache/dir')

  expect(mockInvoke).toHaveBeenCalled()
})

test('addNodeModulesToCache - handles empty node_modules list', async () => {
  const mockInvoke = jest.fn()
  mockInvoke.mockImplementation((method) => {
    if (method === 'FileSystem.findFiles') {
      return []
    }
    if (method === 'FileSystem.applyFileOperations') {
      return undefined
    }
    throw new Error(`unexpected method ${method}`)
  })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  await addNodeModulesToCache('/repo/path', 'commit-hash', '/cache/dir')

  expect(mockInvoke).toHaveBeenCalled()
})

test('addNodeModulesToCache - throws VError when findFiles fails', async () => {
  const mockInvoke = jest.fn()
  mockInvoke.mockImplementation((method) => {
    if (method === 'FileSystem.findFiles') {
      throw new Error('Permission denied')
    }
    throw new Error(`unexpected method ${method}`)
  })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  await expect(addNodeModulesToCache('/repo/path', 'commit-hash', '/cache/dir')).rejects.toThrow(VError)
  await expect(addNodeModulesToCache('/repo/path', 'commit-hash', '/cache/dir')).rejects.toThrow('Failed to cache node_modules')
  expect(mockInvoke).toHaveBeenCalled()
})

test('addNodeModulesToCache - throws VError when getCacheFileOperations fails', async () => {
  const mockInvoke = jest.fn()
  mockInvoke.mockImplementation((method) => {
    if (method === 'FileSystem.findFiles') {
      return ['node_modules']
    }
    if (method === 'FileSystem.applyFileOperations') {
      throw new Error('Invalid path')
    }
    throw new Error(`unexpected method ${method}`)
  })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  await expect(addNodeModulesToCache('/repo/path', 'commit-hash', '/cache/dir')).rejects.toThrow(VError)
  await expect(addNodeModulesToCache('/repo/path', 'commit-hash', '/cache/dir')).rejects.toThrow('Failed to cache node_modules')
  expect(mockInvoke).toHaveBeenCalled()
})

test('addNodeModulesToCache - throws VError when applyFileOperations fails', async () => {
  const mockInvoke = jest.fn()
  mockInvoke.mockImplementation((method) => {
    if (method === 'FileSystem.findFiles') {
      return ['node_modules']
    }
    if (method === 'FileSystem.applyFileOperations') {
      throw new Error('Copy failed')
    }
    throw new Error(`unexpected method ${method}`)
  })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  await expect(addNodeModulesToCache('/repo/path', 'commit-hash', '/cache/dir')).rejects.toThrow(VError)
  await expect(addNodeModulesToCache('/repo/path', 'commit-hash', '/cache/dir')).rejects.toThrow('Failed to cache node_modules')
  expect(mockInvoke).toHaveBeenCalled()
})

test.skip('addNodeModulesToCache - handles complex nested directory structure', async () => {
  const complexNodeModulesPaths = [
    'node_modules',
    'packages/package-a/node_modules',
    'packages/package-b/node_modules',
    'packages/package-c/subpackage/node_modules',
    'apps/app1/node_modules',
    'apps/app2/node_modules',
  ]

  const mockInvoke = jest.fn()
  mockInvoke.mockImplementation((method) => {
    if (method === 'FileSystem.findFiles') {
      return complexNodeModulesPaths
    }
    if (method === 'FileSystem.applyFileOperations') {
      return undefined
    }
    throw new Error(`unexpected method ${method}`)
  })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  await addNodeModulesToCache('/repo/path', 'commit-hash', '/cache/dir')

  expect(mockInvoke).toHaveBeenCalled()
})
