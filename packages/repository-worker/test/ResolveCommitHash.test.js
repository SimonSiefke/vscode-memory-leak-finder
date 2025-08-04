import { test, expect, jest, beforeEach } from '@jest/globals'

const mockExec = jest.fn()
jest.unstable_mockModule('../src/parts/Exec/Exec.js', () => ({
  exec: mockExec,
}))

const { resolveCommitHash } = await import('../src/parts/ResolveCommitHash/ResolveCommitHash.js')

beforeEach(() => {
  mockExec.mockClear()
})

test('resolveCommitHash - returns commitRef when it is already a full commit hash', async () => {
  const fullCommitHash = 'a1b2c3d4e5f6789012345678901234567890abcd'

  const result = await resolveCommitHash('https://github.com/test/repo.git', fullCommitHash)

  expect(result).toBe(fullCommitHash)
  expect(mockExec).not.toHaveBeenCalled()
})

test('resolveCommitHash - resolves branch name to commit hash', async () => {
  const mockStdout = 'a1b2c3d4e5f6789012345678901234567890abcd\trefs/heads/main\n'
      mockExec.mockImplementation(() => ({ stdout: mockStdout, stderr: '' }))

  const result = await resolveCommitHash('https://github.com/test/repo.git', 'main')

  expect(result).toBe('a1b2c3d4e5f6789012345678901234567890abcd')
  expect(mockExec).toHaveBeenCalledTimes(1)
  expect(mockExec).toHaveBeenCalledWith('git', ['ls-remote', 'https://github.com/test/repo.git', 'main'])
})

test('resolveCommitHash - throws error when no commit found', async () => {
      mockExec.mockImplementation(() => ({ stdout: '', stderr: '' }))

  await expect(resolveCommitHash('https://github.com/test/repo.git', 'nonexistent-branch')).rejects.toThrow('No commit found for reference')

  expect(mockExec).toHaveBeenCalledTimes(1)
  expect(mockExec).toHaveBeenCalledWith('git', ['ls-remote', 'https://github.com/test/repo.git', 'nonexistent-branch'])
})

test('resolveCommitHash - throws error when git ls-remote fails', async () => {
  mockExec.mockImplementation(() => Promise.reject(new Error('Repository not found')))

  await expect(resolveCommitHash('https://github.com/test/repo.git', 'main')).rejects.toThrow('Failed to resolve commit reference')

  expect(mockExec).toHaveBeenCalledTimes(1)
  expect(mockExec).toHaveBeenCalledWith('git', ['ls-remote', 'https://github.com/test/repo.git', 'main'])
})

test('resolveCommitHash - resolves tag to commit hash', async () => {
  const mockStdout = 'b2c3d4e5f6789012345678901234567890abcde1\trefs/tags/v1.0.0\n'
      mockExec.mockImplementation(() => ({ stdout: mockStdout, stderr: '' }))

  const result = await resolveCommitHash('https://github.com/test/repo.git', 'v1.0.0')

  expect(result).toBe('b2c3d4e5f6789012345678901234567890abcde1')
  expect(mockExec).toHaveBeenCalledTimes(1)
  expect(mockExec).toHaveBeenCalledWith('git', ['ls-remote', 'https://github.com/test/repo.git', 'v1.0.0'])
})

test('resolveCommitHash - throws error when invalid commit hash returned', async () => {
  const mockStdout = 'invalid-hash\trefs/heads/main\n'
      mockExec.mockImplementation(() => ({ stdout: mockStdout, stderr: '' }))

  await expect(resolveCommitHash('https://github.com/test/repo.git', 'main')).rejects.toThrow('Invalid commit hash resolved')

  expect(mockExec).toHaveBeenCalledTimes(1)
  expect(mockExec).toHaveBeenCalledWith('git', ['ls-remote', 'https://github.com/test/repo.git', 'main'])
})

test('resolveCommitHash - handles multiple lines and takes first result', async () => {
  const mockStdout =
    'a1b2c3d4e5f6789012345678901234567890abcd\trefs/heads/main\nb2c3d4e5f6789012345678901234567890abcde1\trefs/heads/develop\n'
      mockExec.mockImplementation(() => ({ stdout: mockStdout, stderr: '' }))

  const result = await resolveCommitHash('https://github.com/test/repo.git', 'main')

  expect(result).toBe('a1b2c3d4e5f6789012345678901234567890abcd')
  expect(mockExec).toHaveBeenCalledTimes(1)
  expect(mockExec).toHaveBeenCalledWith('git', ['ls-remote', 'https://github.com/test/repo.git', 'main'])
})

test('resolveCommitHash - handles different repository URLs', async () => {
  const mockStdout = 'c3d4e5f6789012345678901234567890abcdef12\trefs/heads/feature\n'
      mockExec.mockImplementation(() => ({ stdout: mockStdout, stderr: '' }))

  const result = await resolveCommitHash('https://gitlab.com/test/repo.git', 'feature')

  expect(result).toBe('c3d4e5f6789012345678901234567890abcdef12')
  expect(mockExec).toHaveBeenCalledTimes(1)
  expect(mockExec).toHaveBeenCalledWith('git', ['ls-remote', 'https://gitlab.com/test/repo.git', 'feature'])
})

test('resolveCommitHash - handles short commit hash input', async () => {
  const shortHash = 'a1b2c3d4'

  await resolveCommitHash('https://github.com/test/repo.git', shortHash)

  // Should call exec since it's not a full 40-character hash
  expect(mockExec).toHaveBeenCalledTimes(1)
  expect(mockExec).toHaveBeenCalledWith('git', ['ls-remote', 'https://github.com/test/repo.git', shortHash])
})
