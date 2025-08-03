import { test, expect, jest, beforeEach } from '@jest/globals'

// Mock the findFiles function
const mockFindFiles = jest.fn()
jest.unstable_mockModule('../src/parts/Filesystem/Filesystem.js', () => ({
  findFiles: mockFindFiles,
}))

beforeEach(() => {
  mockFindFiles.mockClear()
})

test('findPackageLockFiles - returns empty array when no package-lock.json files found', async () => {
  // Mock findFiles to return empty results
  mockFindFiles.mockResolvedValue([])

  const { findPackageLockFiles } = await import('../src/parts/FindPackageLockFiles/FindPackageLockFiles.js')
  const result = await findPackageLockFiles('/test/path')

  expect(result).toEqual([])
  expect(mockFindFiles).toHaveBeenCalledTimes(1)
  expect(mockFindFiles).toHaveBeenCalledWith('**/package-lock.json', {
    cwd: '/test/path',
    exclude: ['**/node_modules/**'],
  })
})

test('findPackageLockFiles - returns file URIs when package-lock.json files found', async () => {
  // Mock findFiles to return some package-lock.json files
  const mockPaths = ['package-lock.json', 'subdir/package-lock.json']
  mockFindFiles.mockResolvedValue(mockPaths)

  const { findPackageLockFiles } = await import('../src/parts/FindPackageLockFiles/FindPackageLockFiles.js')
  const result = await findPackageLockFiles('/test/path')

  expect(result).toEqual(['/test/path/package-lock.json', '/test/path/subdir/package-lock.json'])
  expect(mockFindFiles).toHaveBeenCalledTimes(1)
  expect(mockFindFiles).toHaveBeenCalledWith('**/package-lock.json', {
    cwd: '/test/path',
    exclude: ['**/node_modules/**'],
  })
})

test('findPackageLockFiles - excludes node_modules package-lock.json files', async () => {
  // Mock findFiles to return package-lock.json files including some in node_modules
  // Since we're using the exclude option, findFiles should not return node_modules paths
  const mockPaths = ['package-lock.json', 'subdir/package-lock.json']
  mockFindFiles.mockResolvedValue(mockPaths)

  const { findPackageLockFiles } = await import('../src/parts/FindPackageLockFiles/FindPackageLockFiles.js')
  const result = await findPackageLockFiles('/test/path')

  // Should only return package-lock.json files not in node_modules
  expect(result).toEqual(['/test/path/package-lock.json', '/test/path/subdir/package-lock.json'])
  expect(mockFindFiles).toHaveBeenCalledTimes(1)
  expect(mockFindFiles).toHaveBeenCalledWith('**/package-lock.json', {
    cwd: '/test/path',
    exclude: ['**/node_modules/**'],
  })
})

test('findPackageLockFiles - throws VError when findFiles fails', async () => {
  // Mock findFiles to throw an error
  mockFindFiles.mockRejectedValue(new Error('Permission denied'))

  const { findPackageLockFiles } = await import('../src/parts/FindPackageLockFiles/FindPackageLockFiles.js')
  await expect(findPackageLockFiles('/test/path')).rejects.toThrow('Failed to find package-lock.json files in directory')

  expect(mockFindFiles).toHaveBeenCalledTimes(1)
  expect(mockFindFiles).toHaveBeenCalledWith('**/package-lock.json', {
    cwd: '/test/path',
    exclude: ['**/node_modules/**'],
  })
})
