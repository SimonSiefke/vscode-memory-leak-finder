import { test, expect, jest, beforeEach } from '@jest/globals'
import { pathToFileURL } from 'node:url'

// Mock the glob function
const mockGlob = jest.fn()
jest.unstable_mockModule('node:fs/promises', () => ({
  glob: mockGlob,
}))

beforeEach(() => {
  mockGlob.mockClear()
})

test('findPackageLockFiles - returns empty array when no package-lock.json files found', async () => {
  // Mock glob to return empty results
  mockGlob.mockReturnValue((async function* () {})())

  const { findPackageLockFiles } = await import('../src/parts/FindPackageLockFiles/FindPackageLockFiles.js')
  const result = await findPackageLockFiles('/test/path')

  expect(result).toEqual([])
  expect(mockGlob).toHaveBeenCalledTimes(1)
  expect(mockGlob).toHaveBeenCalledWith('**/package-lock.json', {
    cwd: '/test/path',
    exclude: ['**/node_modules/**'],
  })
})

test('findPackageLockFiles - returns file URIs when package-lock.json files found', async () => {
  // Mock glob to return some package-lock.json files
  const mockPaths = ['package-lock.json', 'subdir/package-lock.json']
  mockGlob.mockReturnValue(
    (async function* () {
      for (const path of mockPaths) {
        yield path
      }
    })(),
  )

  const { findPackageLockFiles } = await import('../src/parts/FindPackageLockFiles/FindPackageLockFiles.js')
  const result = await findPackageLockFiles('/test/path')

  expect(result).toEqual(['test/path/package-lock.json', 'test/path/subdir/package-lock.json'])
  expect(mockGlob).toHaveBeenCalledTimes(1)
  expect(mockGlob).toHaveBeenCalledWith('**/package-lock.json', {
    cwd: '/test/path',
    exclude: ['**/node_modules/**'],
  })
})

test('findPackageLockFiles - excludes node_modules package-lock.json files', async () => {
  // Mock glob to return package-lock.json files including some in node_modules
  // Since we're using the exclude option, glob should not return node_modules paths
  const mockPaths = ['package-lock.json', 'subdir/package-lock.json']
  mockGlob.mockReturnValue(
    (async function* () {
      for (const path of mockPaths) {
        yield path
      }
    })(),
  )

  const { findPackageLockFiles } = await import('../src/parts/FindPackageLockFiles/FindPackageLockFiles.js')
  const result = await findPackageLockFiles('/test/path')

  // Should only return package-lock.json files not in node_modules
  expect(result).toEqual(['/test/path/package-lock.json', '/test/path/subdir/package-lock.json'])
  expect(mockGlob).toHaveBeenCalledTimes(1)
  expect(mockGlob).toHaveBeenCalledWith('**/package-lock.json', {
    cwd: '/test/path',
    exclude: ['**/node_modules/**'],
  })
})

test('findPackageLockFiles - throws VError when glob fails', async () => {
  // Mock glob to throw an error
  mockGlob.mockImplementation(() => {
    throw new Error('Permission denied')
  })

  const { findPackageLockFiles } = await import('../src/parts/FindPackageLockFiles/FindPackageLockFiles.js')
  await expect(findPackageLockFiles('/test/path')).rejects.toThrow('Failed to find package-lock.json files in directory')

  expect(mockGlob).toHaveBeenCalledTimes(1)
  expect(mockGlob).toHaveBeenCalledWith('**/package-lock.json', {
    cwd: '/test/path',
    exclude: ['**/node_modules/**'],
  })
})
