import { expect, test, jest, beforeEach } from '@jest/globals'
import { VError } from '@lvce-editor/verror'

const mockFindFiles = jest.fn()
const mockCopy = jest.fn()
const mockMakeDirectory = jest.fn()
const mockRemove = jest.fn()
const mockReadFileContent = jest.fn()
const mockPathExists = jest.fn()

jest.unstable_mockModule('../src/parts/Filesystem/Filesystem.js', () => ({
  findFiles: mockFindFiles,
  copy: mockCopy,
  makeDirectory: mockMakeDirectory,
  remove: mockRemove,
  readFileContent: mockReadFileContent,
  pathExists: mockPathExists,
}))

const mockGetCacheFileOperations = jest.fn()
const mockApplyFileOperations = jest.fn()

jest.unstable_mockModule('../src/parts/GetCacheFileOperations/GetCacheFileOperations.js', () => ({
  getCacheFileOperations: mockGetCacheFileOperations,
}))

jest.unstable_mockModule('../src/parts/ApplyFileOperations/ApplyFileOperations.js', () => ({
  applyFileOperations: mockApplyFileOperations,
}))

const { addNodeModulesToCache } = await import('../src/parts/CacheNodeModules/CacheNodeModules.js')

beforeEach(() => {
  jest.clearAllMocks()
})

test('addNodeModulesToCache - successfully caches node_modules', async () => {
  const mockNodeModulesPaths = ['node_modules', 'packages/a/node_modules', 'packages/b/node_modules']
  const mockFileOperations = [
    { type: 'mkdir', path: '/cache/dir' },
    { type: 'copy', from: '/repo/path/node_modules', to: '/cache/dir/commit-hash/node_modules' },
  ]

  // @ts-ignore
  mockFindFiles.mockResolvedValue(mockNodeModulesPaths)
  // @ts-ignore
  mockGetCacheFileOperations.mockResolvedValue(mockFileOperations)
  // @ts-ignore
  mockApplyFileOperations.mockResolvedValue(undefined)

  await addNodeModulesToCache('/repo/path', 'commit-hash', '/cache/dir')

  expect(mockFindFiles).toHaveBeenCalledWith('**/node_modules', { cwd: '/repo/path' })
  expect(mockGetCacheFileOperations).toHaveBeenCalledWith(
    '/repo/path',
    'commit-hash',
    '/cache/dir',
    '/cache/dir/commit-hash',
    mockNodeModulesPaths,
  )
  expect(mockApplyFileOperations).toHaveBeenCalledWith(mockFileOperations)
})

test('addNodeModulesToCache - filters out nested node_modules and .git directories', async () => {
  const allNodeModulesPaths = [
    'node_modules',
    'packages/a/node_modules',
    'node_modules/node_modules', // Should be filtered out
    'packages/b/node_modules',
    '.git/node_modules', // Should be filtered out
    'packages/c/node_modules',
  ]
  const expectedFilteredPaths = ['node_modules', 'packages/a/node_modules', 'packages/b/node_modules', 'packages/c/node_modules']
  const mockFileOperations = []

  // @ts-ignore
  mockFindFiles.mockResolvedValue(allNodeModulesPaths)
  // @ts-ignore
  mockGetCacheFileOperations.mockResolvedValue(mockFileOperations)
  // @ts-ignore
  mockApplyFileOperations.mockResolvedValue(undefined)

  await addNodeModulesToCache('/repo/path', 'commit-hash', '/cache/dir')

  expect(mockGetCacheFileOperations).toHaveBeenCalledWith(
    '/repo/path',
    'commit-hash',
    '/cache/dir',
    '/cache/dir/commit-hash',
    expectedFilteredPaths,
  )
})

test('addNodeModulesToCache - handles empty node_modules list', async () => {
  const mockFileOperations = [{ type: 'mkdir', path: '/cache/dir' }]

  // @ts-ignore
  mockFindFiles.mockResolvedValue([])
  // @ts-ignore
  mockGetCacheFileOperations.mockResolvedValue(mockFileOperations)
  // @ts-ignore
  mockApplyFileOperations.mockResolvedValue(undefined)

  await addNodeModulesToCache('/repo/path', 'commit-hash', '/cache/dir')

  expect(mockGetCacheFileOperations).toHaveBeenCalledWith('/repo/path', 'commit-hash', '/cache/dir', '/cache/dir/commit-hash', [])
  expect(mockApplyFileOperations).toHaveBeenCalledWith(mockFileOperations)
})

test('addNodeModulesToCache - throws VError when findFiles fails', async () => {
  const error = new Error('Permission denied')
  // @ts-ignore
  mockFindFiles.mockRejectedValue(error)

  await expect(addNodeModulesToCache('/repo/path', 'commit-hash', '/cache/dir')).rejects.toThrow(VError)
  await expect(addNodeModulesToCache('/repo/path', 'commit-hash', '/cache/dir')).rejects.toThrow('Failed to cache node_modules')

  expect(mockGetCacheFileOperations).not.toHaveBeenCalled()
  expect(mockApplyFileOperations).not.toHaveBeenCalled()
})

test('addNodeModulesToCache - throws VError when getCacheFileOperations fails', async () => {
  const error = new Error('Invalid path')
  // @ts-ignore
  mockFindFiles.mockResolvedValue(['node_modules'])
  // @ts-ignore
  mockGetCacheFileOperations.mockRejectedValue(error)

  await expect(addNodeModulesToCache('/repo/path', 'commit-hash', '/cache/dir')).rejects.toThrow(VError)
  await expect(addNodeModulesToCache('/repo/path', 'commit-hash', '/cache/dir')).rejects.toThrow('Failed to cache node_modules')

  expect(mockApplyFileOperations).not.toHaveBeenCalled()
})

test('addNodeModulesToCache - throws VError when applyFileOperations fails', async () => {
  const error = new Error('Copy failed')
  const mockFileOperations = [{ type: 'copy', from: '/source', to: '/dest' }]

  // @ts-ignore
  mockFindFiles.mockResolvedValue(['node_modules'])
  // @ts-ignore
  mockGetCacheFileOperations.mockResolvedValue(mockFileOperations)
  // @ts-ignore
  mockApplyFileOperations.mockRejectedValue(error)

  await expect(addNodeModulesToCache('/repo/path', 'commit-hash', '/cache/dir')).rejects.toThrow(VError)
  await expect(addNodeModulesToCache('/repo/path', 'commit-hash', '/cache/dir')).rejects.toThrow('Failed to cache node_modules')
})

test('addNodeModulesToCache - handles complex nested directory structure', async () => {
  const complexNodeModulesPaths = [
    'node_modules',
    'packages/package-a/node_modules',
    'packages/package-b/node_modules',
    'packages/package-c/subpackage/node_modules',
    'apps/app1/node_modules',
    'apps/app2/node_modules',
  ]
  const mockFileOperations = [
    { type: 'mkdir', path: '/cache/dir' },
    { type: 'copy', from: '/repo/path/node_modules', to: '/cache/dir/commit-hash/node_modules' },
  ]

  // @ts-ignore
  mockFindFiles.mockResolvedValue(complexNodeModulesPaths)
  // @ts-ignore
  mockGetCacheFileOperations.mockResolvedValue(mockFileOperations)
  // @ts-ignore
  mockApplyFileOperations.mockResolvedValue(undefined)

  await addNodeModulesToCache('/repo/path', 'commit-hash', '/cache/dir')

  expect(mockGetCacheFileOperations).toHaveBeenCalledWith(
    '/repo/path',
    'commit-hash',
    '/cache/dir',
    '/cache/dir/commit-hash',
    complexNodeModulesPaths,
  )
})
