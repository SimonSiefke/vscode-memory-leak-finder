import { test, expect, jest, beforeEach } from '@jest/globals'

const mockFindFiles = jest.fn(async () => [''])
jest.unstable_mockModule('../src/parts/Filesystem/Filesystem.js', () => ({
  findFiles: mockFindFiles,
}))

const { findPackageLockFiles } = await import('../src/parts/FindPackageLockFiles/FindPackageLockFiles.js')

beforeEach(() => {
  mockFindFiles.mockClear()
})

test('findPackageLockFiles - returns empty array when no package-lock.json files found', async () => {

  mockFindFiles.mockResolvedValue([])

  const result = await findPackageLockFiles('/test/path')

  expect(result).toEqual([])
  expect(mockFindFiles).toHaveBeenCalledTimes(1)
  // @ts-ignore
  expect(mockFindFiles).toHaveBeenCalledWith('**/package-lock.json', {
    cwd: '/test/path',
    exclude: ['**/node_modules/**'],
  })
})

test('findPackageLockFiles - returns file URIs when package-lock.json files found', async () => {
  const mockPaths = ['package-lock.json', 'subdir/package-lock.json']

  mockFindFiles.mockResolvedValue(mockPaths)

  const result = await findPackageLockFiles('/test/path')

  expect(result).toEqual(['/test/path/package-lock.json', '/test/path/subdir/package-lock.json'])
  expect(mockFindFiles).toHaveBeenCalledTimes(1)
  // @ts-ignore
  expect(mockFindFiles).toHaveBeenCalledWith('**/package-lock.json', {
    cwd: '/test/path',
    exclude: ['**/node_modules/**'],
  })
})

test('findPackageLockFiles - excludes node_modules package-lock.json files', async () => {
  const mockPaths = ['package-lock.json', 'subdir/package-lock.json']

  mockFindFiles.mockResolvedValue(mockPaths)

  const result = await findPackageLockFiles('/test/path')

  // Should only return package-lock.json files not in node_modules
  expect(result).toEqual(['/test/path/package-lock.json', '/test/path/subdir/package-lock.json'])
  expect(mockFindFiles).toHaveBeenCalledTimes(1)
  // @ts-ignore
  expect(mockFindFiles).toHaveBeenCalledWith('**/package-lock.json', {
    cwd: '/test/path',
    exclude: ['**/node_modules/**'],
  })
})

test('findPackageLockFiles - throws VError when findFiles fails', async () => {

  mockFindFiles.mockRejectedValue(new Error('Permission denied'))

  await expect(findPackageLockFiles('/test/path')).rejects.toThrow('Failed to find package-lock.json files in directory')

  expect(mockFindFiles).toHaveBeenCalledTimes(1)
  // @ts-ignore
  expect(mockFindFiles).toHaveBeenCalledWith('**/package-lock.json', {
    cwd: '/test/path',
    exclude: ['**/node_modules/**'],
  })
})
