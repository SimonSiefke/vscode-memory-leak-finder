import { expect, test, jest } from '@jest/globals'

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

test('addNodeModulesToCache - calls required functions with correct parameters', async () => {
  // @ts-ignore
  mockFindFiles.mockResolvedValue(['node_modules'])
  // @ts-ignore
  mockGetCacheFileOperations.mockResolvedValue([])
  // @ts-ignore
  mockApplyFileOperations.mockResolvedValue(undefined)

  await addNodeModulesToCache('/repo/path', 'commit-hash', '/cache/dir')

  expect(mockFindFiles).toHaveBeenCalledWith('**/node_modules', { cwd: '/repo/path' })
  expect(mockGetCacheFileOperations).toHaveBeenCalled()
  expect(mockApplyFileOperations).toHaveBeenCalled()
})
