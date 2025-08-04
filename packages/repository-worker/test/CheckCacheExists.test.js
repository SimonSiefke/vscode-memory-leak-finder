import { expect, test, jest } from '@jest/globals'

const mockPathJoin = jest.fn(() => '')
const mockPathExists = jest.fn(async () => false)

jest.unstable_mockModule('../src/parts/Path/Path.js', () => ({
  join: mockPathJoin,
}))

jest.unstable_mockModule('../src/parts/Filesystem/Filesystem.js', () => ({
  pathExists: mockPathExists,
}))

const { checkCacheExists } = await import('../src/parts/CheckCacheExists/CheckCacheExists.js')

test('checkCacheExists returns true when cache exists', async () => {
  const commitHash = 'test-commit'
  const cacheDir = '/test/cache'
  const cachedNodeModulesPath = '/test/cache/test-commit'

  mockPathJoin.mockReturnValue(cachedNodeModulesPath)
  mockPathExists.mockResolvedValue(true)

  const result = await checkCacheExists(commitHash, cacheDir)

  expect(result).toBe(true)
  expect(mockPathJoin).toHaveBeenCalledWith(cacheDir, commitHash)
  expect(mockPathExists).toHaveBeenCalledWith(cachedNodeModulesPath)
})

test('checkCacheExists returns false when cache does not exist', async () => {
  const commitHash = 'test-commit'
  const cacheDir = '/test/cache'
  const cachedNodeModulesPath = '/test/cache/test-commit'

  mockPathJoin.mockReturnValue(cachedNodeModulesPath)
  mockPathExists.mockResolvedValue(false)

  const result = await checkCacheExists(commitHash, cacheDir)

  expect(result).toBe(false)
  expect(mockPathJoin).toHaveBeenCalledWith(cacheDir, commitHash)
  expect(mockPathExists).toHaveBeenCalledWith(cachedNodeModulesPath)
})

test('checkCacheExists throws VError when pathExists fails', async () => {
  const commitHash = 'test-commit'
  const cacheDir = '/test/cache'
  const cachedNodeModulesPath = '/test/cache/test-commit'
  const error = new Error('File system error')

  mockPathJoin.mockReturnValue(cachedNodeModulesPath)
  mockPathExists.mockRejectedValue(error)

  await expect(checkCacheExists(commitHash, cacheDir)).rejects.toThrow(`Failed to check if cache exists for commit hash: ${commitHash}`)
})
