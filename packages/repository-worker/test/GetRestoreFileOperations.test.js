import { expect, test, jest } from '@jest/globals'
import { getRestoreNodeModulesFileOperations } from '../src/parts/GetRestoreFileOperations/GetRestoreFileOperations.js'

test('getRestoreNodeModulesFileOperations returns empty array when no cached paths', async () => {
  const result = await getRestoreNodeModulesFileOperations('/test/repo', 'cache-key', '/test/cache', '/test/cache/cache-key', [])
  expect(result).toEqual([])
})

test('getRestoreNodeModulesFileOperations returns copy operations for cached paths', async () => {
  const repoPath = '/test/repo'
  const cacheKey = 'cache-key'
  const cacheDir = '/test/cache'
  const cachedNodeModulesPath = '/test/cache/cache-key'
  const cachedNodeModulesPaths = ['node_modules/package1', 'node_modules/package2']

  const result = await getRestoreNodeModulesFileOperations(repoPath, cacheKey, cacheDir, cachedNodeModulesPath, cachedNodeModulesPaths)

  expect(result).toHaveLength(2)
  expect(result[0]).toEqual({
    type: 'copy',
    from: '/test/cache/cache-key/node_modules/package1',
    to: '/test/repo/node_modules/package1',
  })
  expect(result[1]).toEqual({
    type: 'copy',
    from: '/test/cache/cache-key/node_modules/package2',
    to: '/test/repo/node_modules/package2',
  })
})

test('getRestoreNodeModulesFileOperations handles paths with leading slashes', async () => {
  const repoPath = '/test/repo'
  const cacheKey = 'cache-key'
  const cacheDir = '/test/cache'
  const cachedNodeModulesPath = '/test/cache/cache-key'
  const cachedNodeModulesPaths = ['/node_modules/package1']

  const result = await getRestoreNodeModulesFileOperations(repoPath, cacheKey, cacheDir, cachedNodeModulesPath, cachedNodeModulesPaths)

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    type: 'copy',
    from: '/test/cache/cache-key/node_modules/package1',
    to: '/test/repo/node_modules/package1',
  })
})

test('getRestoreNodeModulesFileOperations throws VError when error occurs', async () => {
  const mockPathJoin = jest.fn(() => {
    throw new Error('Path join error')
  })

  jest.unstable_mockModule('../src/parts/Path/Path.js', () => ({
    join: mockPathJoin,
  }))

  const { getRestoreNodeModulesFileOperations } = await import('../src/parts/GetRestoreFileOperations/GetRestoreFileOperations.js')

  await expect(getRestoreNodeModulesFileOperations('/test/repo', 'cache-key', '/test/cache', '/test/cache/cache-key', ['node_modules/package'])).rejects.toThrow('Failed to get restore file operations')
})
