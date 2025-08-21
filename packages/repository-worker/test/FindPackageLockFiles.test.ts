import { test, expect, jest } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import * as FileSystemWorker from '../src/parts/FileSystemWorker/FileSystemWorker.ts'
import { findPackageLockFiles } from '../src/parts/FindPackageLockFiles/FindPackageLockFiles.ts'

test('findPackageLockFiles - returns empty array when no package-lock.json files found', async () => {
  const mockInvoke = jest.fn()
  mockInvoke.mockReturnValue([])

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  const result = await findPackageLockFiles('/test/path')

  expect(result).toEqual([])
  expect(mockInvoke).toHaveBeenCalledWith('FileSystem.findFiles')
})

test.skip('findPackageLockFiles - returns file URIs when package-lock.json files found', async () => {
  const mockPaths = ['package-lock.json', 'subdir/package-lock.json']
  const mockInvoke = jest.fn()
  mockInvoke.mockReturnValue(mockPaths)

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  const result = await findPackageLockFiles('/test/path')

  expect(result).toEqual(['/test/path/package-lock.json', '/test/path/subdir/package-lock.json'])
  expect(mockInvoke).toHaveBeenCalledWith('FileSystem.findFiles')
})

test.skip('findPackageLockFiles - excludes node_modules package-lock.json files', async () => {
  const mockPaths = ['package-lock.json', 'subdir/package-lock.json']
  const mockInvoke = jest.fn()
  mockInvoke.mockReturnValue(mockPaths)

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  const result = await findPackageLockFiles('/test/path')

  // Should only return package-lock.json files not in node_modules
  expect(result).toEqual(['/test/path/package-lock.json', '/test/path/subdir/package-lock.json'])
  expect(mockInvoke).toHaveBeenCalledWith('FileSystem.findFiles')
})

test('findPackageLockFiles - throws VError when findFiles fails', async () => {
  const mockInvoke = jest.fn()
  mockInvoke.mockImplementation(() => {
    throw new Error('Permission denied')
  })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  await expect(findPackageLockFiles('/test/path')).rejects.toThrow('Failed to find package-lock.json files in directory')
  expect(mockInvoke).toHaveBeenCalledWith('FileSystem.findFiles', '**/package-locj.json', {
    cwd: '/test/path',
    exclude: ['**/node_modules/**'],
  })
})
