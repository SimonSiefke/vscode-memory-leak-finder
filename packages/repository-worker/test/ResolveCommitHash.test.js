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

test('resolveCommitHash - resolves tag to commit hash', async () => {
  const mockStdout = 'b2c3d4e5f6789012345678901234567890abcde1\trefs/tags/v1.0.0\n'
  mockExeca.mockImplementation(() => Promise.resolve({ stdout: mockStdout }))

  const { resolveCommitHash } = await import('../src/parts/ResolveCommitHash/ResolveCommitHash.js')
  const result = await resolveCommitHash('https://github.com/test/repo.git', 'v1.0.0')

  expect(result).toBe('b2c3d4e5f6789012345678901234567890abcde1')
  expect(mockExeca).toHaveBeenCalledTimes(1)
  expect(mockExeca).toHaveBeenCalledWith('git', [
    'ls-remote',
    'https://github.com/test/repo.git',
    'v1.0.0'
  ])
})

test('resolveCommitHash - throws error when invalid commit hash returned', async () => {
  const mockStdout = 'invalid-hash\trefs/heads/main\n'
  mockExeca.mockImplementation(() => Promise.resolve({ stdout: mockStdout }))

  const { resolveCommitHash } = await import('../src/parts/ResolveCommitHash/ResolveCommitHash.js')

  await expect(resolveCommitHash('https://github.com/test/repo.git', 'main'))
    .rejects.toThrow('Invalid commit hash resolved')

  expect(mockExeca).toHaveBeenCalledTimes(1)
  expect(mockExeca).toHaveBeenCalledWith('git', [
    'ls-remote',
    'https://github.com/test/repo.git',
    'main'
  ])
})

test('resolveCommitHash - handles multiple lines and takes first result', async () => {
  const mockStdout = 'a1b2c3d4e5f6789012345678901234567890abcd\trefs/heads/main\nb2c3d4e5f6789012345678901234567890abcde1\trefs/heads/develop\n'
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

test('resolveCommitHash - handles different repository URLs', async () => {
  const mockStdout = 'c3d4e5f6789012345678901234567890abcdef12\trefs/heads/feature\n'
  mockExeca.mockImplementation(() => Promise.resolve({ stdout: mockStdout }))

  const { resolveCommitHash } = await import('../src/parts/ResolveCommitHash/ResolveCommitHash.js')
  const result = await resolveCommitHash('https://gitlab.com/test/repo.git', 'feature')

  expect(result).toBe('c3d4e5f6789012345678901234567890abcdef12')
  expect(mockExeca).toHaveBeenCalledTimes(1)
  expect(mockExeca).toHaveBeenCalledWith('git', [
    'ls-remote',
    'https://gitlab.com/test/repo.git',
    'feature'
  ])
})

test('resolveCommitHash - handles short commit hash input', async () => {
  const shortHash = 'a1b2c3d4'

  const { resolveCommitHash } = await import('../src/parts/ResolveCommitHash/ResolveCommitHash.js')
  await resolveCommitHash('https://github.com/test/repo.git', shortHash)

  // Should call execa since it's not a full 40-character hash
  expect(mockExeca).toHaveBeenCalledTimes(1)
  expect(mockExeca).toHaveBeenCalledWith('git', [
    'ls-remote',
    'https://github.com/test/repo.git',
    shortHash
  ])
})