import { test, expect } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import * as FileSystemWorker from '../src/parts/FileSystemWorker/FileSystemWorker.js'

test('resolveCommitHash - returns commitRef when it is already a full commit hash', async () => {
  const fullCommitHash = 'a1b2c3d4e5f6789012345678901234567890abcd'

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: () => { throw new Error('should not be called') },
  })
  FileSystemWorker.set(mockRpc)

  const { resolveCommitHash } = await import('../src/parts/ResolveCommitHash/ResolveCommitHash.js')
  const result = await resolveCommitHash('https://github.com/test/repo.git', fullCommitHash)
  expect(result).toBe(fullCommitHash)
})

test('resolveCommitHash - resolves branch name to commit hash', async () => {
  const mockStdout = 'a1b2c3d4e5f6789012345678901234567890abcd\trefs/heads/main\n'
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: () => ({ stdout: mockStdout, stderr: '' }),
  })
  FileSystemWorker.set(mockRpc)

  const { resolveCommitHash } = await import('../src/parts/ResolveCommitHash/ResolveCommitHash.js')
  const result = await resolveCommitHash('https://github.com/test/repo.git', 'main')
  expect(result).toBe('a1b2c3d4e5f6789012345678901234567890abcd')
})

test('resolveCommitHash - throws error when no commit found', async () => {
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: () => ({ stdout: '', stderr: '' }),
  })
  FileSystemWorker.set(mockRpc)

  const { resolveCommitHash } = await import('../src/parts/ResolveCommitHash/ResolveCommitHash.js')
  await expect(resolveCommitHash('https://github.com/test/repo.git', 'nonexistent-branch')).rejects.toThrow('No commit found for reference')
})

test('resolveCommitHash - throws error when git ls-remote fails', async () => {
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: () => { throw new Error('Repository not found') },
  })
  FileSystemWorker.set(mockRpc)

  const { resolveCommitHash } = await import('../src/parts/ResolveCommitHash/ResolveCommitHash.js')
  await expect(resolveCommitHash('https://github.com/test/repo.git', 'main')).rejects.toThrow('Failed to resolve commit reference')
})

test('resolveCommitHash - resolves tag to commit hash', async () => {
  const mockStdout = 'b2c3d4e5f6789012345678901234567890abcde1\trefs/tags/v1.0.0\n'
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: () => ({ stdout: mockStdout, stderr: '' }),
  })
  FileSystemWorker.set(mockRpc)

  const { resolveCommitHash } = await import('../src/parts/ResolveCommitHash/ResolveCommitHash.js')
  const result = await resolveCommitHash('https://github.com/test/repo.git', 'v1.0.0')
  expect(result).toBe('b2c3d4e5f6789012345678901234567890abcde1')
})

test('resolveCommitHash - throws error when invalid commit hash returned', async () => {
  const mockStdout = 'invalid-hash\trefs/heads/main\n'
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: () => ({ stdout: mockStdout, stderr: '' }),
  })
  FileSystemWorker.set(mockRpc)

  const { resolveCommitHash } = await import('../src/parts/ResolveCommitHash/ResolveCommitHash.js')
  await expect(resolveCommitHash('https://github.com/test/repo.git', 'main')).rejects.toThrow('Invalid commit hash resolved')
})

test('resolveCommitHash - handles multiple lines and takes first result', async () => {
  const mockStdout =
    'a1b2c3d4e5f6789012345678901234567890abcd\trefs/heads/main\nb2c3d4e5f6789012345678901234567890abcde1\trefs/heads/develop\n'
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: () => ({ stdout: mockStdout, stderr: '' }),
  })
  FileSystemWorker.set(mockRpc)

  const { resolveCommitHash } = await import('../src/parts/ResolveCommitHash/ResolveCommitHash.js')
  const result = await resolveCommitHash('https://github.com/test/repo.git', 'main')
  expect(result).toBe('a1b2c3d4e5f6789012345678901234567890abcd')
})

test('resolveCommitHash - handles different repository URLs', async () => {
  const mockStdout = 'c3d4e5f6789012345678901234567890abcdef12\trefs/heads/feature\n'
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: () => ({ stdout: mockStdout, stderr: '' }),
  })
  FileSystemWorker.set(mockRpc)

  const { resolveCommitHash } = await import('../src/parts/ResolveCommitHash/ResolveCommitHash.js')
  const result = await resolveCommitHash('https://gitlab.com/test/repo.git', 'feature')
  expect(result).toBe('c3d4e5f6789012345678901234567890abcdef12')
})

test('resolveCommitHash - handles short commit hash input', async () => {
  const shortHash = 'a1b2c3d4'
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: () => ({ stdout: '', stderr: '' }),
  })
  FileSystemWorker.set(mockRpc)

  const { resolveCommitHash } = await import('../src/parts/ResolveCommitHash/ResolveCommitHash.js')
  await resolveCommitHash('https://github.com/test/repo.git', shortHash)
})
