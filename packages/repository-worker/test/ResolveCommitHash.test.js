import { test, expect, jest } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import * as FileSystemWorker from '../src/parts/FileSystemWorker/FileSystemWorker.js'
import { resolveCommitHash } from '../src/parts/ResolveCommitHash/ResolveCommitHash.js'

test('resolveCommitHash - returns commitRef when it is already a full commit hash', async () => {
  const fullCommitHash = 'a1b2c3d4e5f6789012345678901234567890abcd'

  const mockInvoke = jest.fn()
  mockInvoke.mockImplementation(() => { throw new Error('should not be called') })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  const result = await resolveCommitHash('https://github.com/test/repo.git', fullCommitHash)
  expect(result).toBe(fullCommitHash)
  expect(mockInvoke).not.toHaveBeenCalled()
})

test('resolveCommitHash - resolves branch name to commit hash', async () => {
  const mockStdout = 'a1b2c3d4e5f6789012345678901234567890abcd\trefs/heads/main\n'
  const mockInvoke = jest.fn()
  mockInvoke.mockReturnValue({ stdout: mockStdout, stderr: '' })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  const result = await resolveCommitHash('https://github.com/test/repo.git', 'main')
  expect(result).toBe('a1b2c3d4e5f6789012345678901234567890abcd')
  expect(mockInvoke).toHaveBeenCalledWith('FileSystem.exec', 'git', ['ls-remote', 'https://github.com/test/repo.git', 'main'], {})
})

test('resolveCommitHash - throws error when no commit found', async () => {
  const mockInvoke = jest.fn()
  mockInvoke.mockReturnValue({ stdout: '', stderr: '' })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  await expect(resolveCommitHash('https://github.com/test/repo.git', 'nonexistent-branch')).rejects.toThrow('No commit found for reference')
  expect(mockInvoke).toHaveBeenCalledWith('FileSystem.exec', 'git', ['ls-remote', 'https://github.com/test/repo.git', 'nonexistent-branch'], {})
})

test('resolveCommitHash - throws error when git ls-remote fails', async () => {
  const mockInvoke = jest.fn()
  mockInvoke.mockImplementation(() => { throw new Error('Repository not found') })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  await expect(resolveCommitHash('https://github.com/test/repo.git', 'main')).rejects.toThrow('Failed to resolve commit reference')
  expect(mockInvoke).toHaveBeenCalledWith('FileSystem.exec', 'git', ['ls-remote', 'https://github.com/test/repo.git', 'main'], {})
})

test('resolveCommitHash - resolves tag to commit hash', async () => {
  const mockStdout = 'b2c3d4e5f6789012345678901234567890abcde1\trefs/tags/v1.0.0\n'
  const mockInvoke = jest.fn()
  mockInvoke.mockReturnValue({ stdout: mockStdout, stderr: '' })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  const result = await resolveCommitHash('https://github.com/test/repo.git', 'v1.0.0')
  expect(result).toBe('b2c3d4e5f6789012345678901234567890abcde1')
  expect(mockInvoke).toHaveBeenCalledWith('FileSystem.exec', 'git', ['ls-remote', 'https://github.com/test/repo.git', 'v1.0.0'], {})
})

test('resolveCommitHash - throws error when invalid commit hash returned', async () => {
  const mockStdout = 'invalid-hash\trefs/heads/main\n'
  const mockInvoke = jest.fn()
  mockInvoke.mockReturnValue({ stdout: mockStdout, stderr: '' })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  await expect(resolveCommitHash('https://github.com/test/repo.git', 'main')).rejects.toThrow('Invalid commit hash resolved')
  expect(mockInvoke).toHaveBeenCalledWith('FileSystem.exec', 'git', ['ls-remote', 'https://github.com/test/repo.git', 'main'], {})
})

test('resolveCommitHash - handles multiple lines and takes first result', async () => {
  const mockStdout =
    'a1b2c3d4e5f6789012345678901234567890abcd\trefs/heads/main\nb2c3d4e5f6789012345678901234567890abcde1\trefs/heads/develop\n'
  const mockInvoke = jest.fn()
  mockInvoke.mockReturnValue({ stdout: mockStdout, stderr: '' })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  const result = await resolveCommitHash('https://github.com/test/repo.git', 'main')
  expect(result).toBe('a1b2c3d4e5f6789012345678901234567890abcd')
  expect(mockInvoke).toHaveBeenCalledWith('FileSystem.exec', 'git', ['ls-remote', 'https://github.com/test/repo.git', 'main'], {})
})

test('resolveCommitHash - handles different repository URLs', async () => {
  const mockStdout = 'c3d4e5f6789012345678901234567890abcdef12\trefs/heads/feature\n'
  const mockInvoke = jest.fn()
  mockInvoke.mockReturnValue({ stdout: mockStdout, stderr: '' })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  const result = await resolveCommitHash('https://gitlab.com/test/repo.git', 'feature')
  expect(result).toBe('c3d4e5f6789012345678901234567890abcdef12')
  expect(mockInvoke).toHaveBeenCalledWith('FileSystem.exec', 'git', ['ls-remote', 'https://gitlab.com/test/repo.git', 'feature'], {})
})

test('resolveCommitHash - handles short commit hash input', async () => {
  const shortHash = 'a1b2c3d4'
  const mockInvoke = jest.fn()
  mockInvoke.mockReturnValue({ stdout: '', stderr: '' })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  await expect(resolveCommitHash('https://github.com/test/repo.git', shortHash)).rejects.toThrow('No commit found for reference')
  expect(mockInvoke).toHaveBeenCalledWith('FileSystem.exec', 'git', ['ls-remote', 'https://github.com/test/repo.git', 'a1b2c3d4'], {})
})
