import { test, expect, beforeEach } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import * as FileSystemWorker from '../src/parts/FileSystemWorker/FileSystemWorker.js'

test('findPackageLockFiles - returns empty array when no package-lock.json files found', async () => {
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'FileSystem.findFiles') {
        return []
      }
      throw new Error(`unexpected method ${method}`)
    },
  })
  FileSystemWorker.set(mockRpc)

  const { findPackageLockFiles } = await import('../src/parts/FindPackageLockFiles/FindPackageLockFiles.js')
  const result = await findPackageLockFiles('/test/path')

  expect(result).toEqual([])
})

test('findPackageLockFiles - returns file URIs when package-lock.json files found', async () => {
  const mockPaths = ['package-lock.json', 'subdir/package-lock.json']

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'FileSystem.findFiles') {
        return mockPaths
      }
      throw new Error(`unexpected method ${method}`)
    },
  })
  FileSystemWorker.set(mockRpc)

  const { findPackageLockFiles } = await import('../src/parts/FindPackageLockFiles/FindPackageLockFiles.js')
  const result = await findPackageLockFiles('/test/path')

  expect(result).toEqual(['/test/path/package-lock.json', '/test/path/subdir/package-lock.json'])
})

test('findPackageLockFiles - excludes node_modules package-lock.json files', async () => {
  const mockPaths = ['package-lock.json', 'subdir/package-lock.json']

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'FileSystem.findFiles') {
        return mockPaths
      }
      throw new Error(`unexpected method ${method}`)
    },
  })
  FileSystemWorker.set(mockRpc)

  const { findPackageLockFiles } = await import('../src/parts/FindPackageLockFiles/FindPackageLockFiles.js')
  const result = await findPackageLockFiles('/test/path')

  // Should only return package-lock.json files not in node_modules
  expect(result).toEqual(['/test/path/package-lock.json', '/test/path/subdir/package-lock.json'])
})

test('findPackageLockFiles - throws VError when findFiles fails', async () => {
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'FileSystem.findFiles') {
        throw new Error('Permission denied')
      }
      throw new Error(`unexpected method ${method}`)
    },
  })
  FileSystemWorker.set(mockRpc)

  const { findPackageLockFiles } = await import('../src/parts/FindPackageLockFiles/FindPackageLockFiles.js')
  await expect(findPackageLockFiles('/test/path')).rejects.toThrow('Failed to find package-lock.json files in directory')
})
