import { test, expect, jest, beforeEach } from '@jest/globals'

// Mock the execa function
const mockExeca = jest.fn()
jest.unstable_mockModule('execa', () => ({
  execa: mockExeca
}))

beforeEach(() => {
  mockExeca.mockClear()
})

test('resolveCommitHash - returns commitRef when it is already a full commit hash', async () => {
  const fullCommitHash = 'a1b2c3d4e5f6789012345678901234567890abcd'

  const { resolveCommitHash } = await import('../src/parts/ResolveCommitHash/ResolveCommitHash.js')
  const result = await resolveCommitHash('https://github.com/test/repo.git', fullCommitHash)

  expect(result).toBe(fullCommitHash)
  expect(mockExeca).not.toHaveBeenCalled()
})

test('resolveCommitHash - resolves branch name to commit hash', async () => {
  const mockStdout = 'a1b2c3d4e5f6789012345678901234567890abcd\trefs/heads/main\n'
  mockExeca.mockImplementation(() => Promise.resolve({ stdout: mockStdout }))

  const { resolveCommitHash } = await import('../src/parts/ResolveCommitHash/ResolveCommitHash.js')
  const result = await resolveCommitHash('https://github.com/test/repo.git', 'main')

  expect(result).toBe('a1b2c3d4e5f6789012345678901234567890abcd')
  expect(mockExeca).toHaveBeenCalledTimes(1)
  expect(mockExeca).toHaveBeenCalledWith('git', [
    'ls-remote',
    'https://github.com/test/repo.git',
    'main'
  ])
})

test('resolveCommitHash - throws error when no commit found', async () => {
  mockExeca.mockImplementation(() => Promise.resolve({ stdout: '' }))

  const { resolveCommitHash } = await import('../src/parts/ResolveCommitHash/ResolveCommitHash.js')

  await expect(resolveCommitHash('https://github.com/test/repo.git', 'nonexistent-branch'))
    .rejects.toThrow('No commit found for reference')

  expect(mockExeca).toHaveBeenCalledTimes(1)
  expect(mockExeca).toHaveBeenCalledWith('git', [
    'ls-remote',
    'https://github.com/test/repo.git',
    'nonexistent-branch'
  ])
})

test('resolveCommitHash - throws error when git ls-remote fails', async () => {
  mockExeca.mockImplementation(() => Promise.reject(new Error('Repository not found')))

  const { resolveCommitHash } = await import('../src/parts/ResolveCommitHash/ResolveCommitHash.js')

  await expect(resolveCommitHash('https://github.com/test/repo.git', 'main'))
    .rejects.toThrow('Failed to resolve commit reference')

  expect(mockExeca).toHaveBeenCalledTimes(1)
  expect(mockExeca).toHaveBeenCalledWith('git', [
    'ls-remote',
    'https://github.com/test/repo.git',
    'main'
  ])
})