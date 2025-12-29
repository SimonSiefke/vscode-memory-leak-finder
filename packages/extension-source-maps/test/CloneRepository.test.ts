import { beforeEach, expect, jest, test } from '@jest/globals'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { MockRpc } from '@lvce-editor/rpc'

beforeEach(() => {
  jest.resetModules()
})

test('cloneRepository - executes git commands in sequence', async () => {
  const tempDir = join(tmpdir(), `test-clone-repo-${Date.now()}`)
  const repoUrl = 'git@github.com:test/repo.git'
  const commit = 'abc123'

  const execCalls: Array<{ command: string; args: string[]; cwd?: string }> = []

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[], options: any) => {
      if (method === 'exec.exec') {
        execCalls.push({ command, args, cwd: options?.cwd })
        return {
          exitCode: 0,
          stdout: '',
          stderr: '',
        }
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  jest.unstable_mockModule('../src/parts/Exec/Exec.ts', () => ({
    exec: async (command: string, args: string[], options: any) => {
      return mockRpc.invoke('exec.exec', command, args, options)
    },
  }))

  const { cloneRepository } = await import('../src/parts/CloneRepository/CloneRepository.ts')
  await cloneRepository(repoUrl, tempDir, commit)

  expect(execCalls.length).toBe(4)
  expect(execCalls[0].command).toBe('git')
  expect(execCalls[0].args).toEqual(['-c', 'init.defaultbranch=main', 'init'])
  expect(execCalls[1].command).toBe('git')
  expect(execCalls[1].args).toEqual(['remote', 'add', 'origin', repoUrl])
  expect(execCalls[2].command).toBe('git')
  expect(execCalls[2].args).toEqual(['fetch', '--depth', '1', 'origin', commit])
  expect(execCalls[3].command).toBe('git')
  expect(execCalls[3].args).toEqual(['-c', 'advice.detachedHead=false', 'checkout', 'FETCH_HEAD'])

  await rm(tempDir, { recursive: true, force: true })
})

test('cloneRepository - creates directory if it does not exist', async () => {
  const tempDir = join(tmpdir(), `test-clone-repo-${Date.now()}`)
  const repoUrl = 'git@github.com:test/repo.git'
  const commit = 'abc123'

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string) => {
      if (method === 'exec.exec') {
        return {
          exitCode: 0,
          stdout: '',
          stderr: '',
        }
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  jest.unstable_mockModule('../src/parts/Exec/Exec.ts', () => ({
    exec: async (command: string, args: string[], options: any) => {
      return mockRpc.invoke('exec.exec', command, args, options)
    },
  }))

  const { cloneRepository } = await import('../src/parts/CloneRepository/CloneRepository.ts')
  await cloneRepository(repoUrl, tempDir, commit)

  const { access } = await import('node:fs/promises')
  await expect(access(tempDir)).resolves.not.toThrow()

  await rm(tempDir, { recursive: true, force: true })
})

test('cloneRepository - throws VError when git init fails', async () => {
  const tempDir = join(tmpdir(), `test-clone-repo-${Date.now()}`)
  const repoUrl = 'git@github.com:test/repo.git'
  const commit = 'abc123'

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string) => {
      if (method === 'exec.exec' && command === 'git') {
        throw new Error('git init failed')
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  jest.unstable_mockModule('../src/parts/Exec/Exec.ts', () => ({
    exec: async (command: string, args: string[], options: any) => {
      return mockRpc.invoke('exec.exec', command, args, options)
    },
  }))

  const { cloneRepository } = await import('../src/parts/CloneRepository/CloneRepository.ts')
  await expect(cloneRepository(repoUrl, tempDir, commit)).rejects.toThrow(`Failed to clone repository from '${repoUrl}' to '${tempDir}'`)

  await rm(tempDir, { recursive: true, force: true }).catch(() => {})
})

test('cloneRepository - throws VError when git fetch fails', async () => {
  const tempDir = join(tmpdir(), `test-clone-repo-${Date.now()}`)
  const repoUrl = 'git@github.com:test/repo.git'
  const commit = 'abc123'

  let callCount = 0
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[]) => {
      if (method === 'exec.exec' && command === 'git') {
        callCount++
        if (callCount === 3) {
          throw new Error('git fetch failed')
        }
        return {
          exitCode: 0,
          stdout: '',
          stderr: '',
        }
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  jest.unstable_mockModule('../src/parts/Exec/Exec.ts', () => ({
    exec: async (command: string, args: string[], options: any) => {
      return mockRpc.invoke('exec.exec', command, args, options)
    },
  }))

  const { cloneRepository } = await import('../src/parts/CloneRepository/CloneRepository.ts')
  await expect(cloneRepository(repoUrl, tempDir, commit)).rejects.toThrow(`Failed to clone repository from '${repoUrl}' to '${tempDir}'`)

  await rm(tempDir, { recursive: true, force: true }).catch(() => {})
})

test('cloneRepository - handles different repo URLs', async () => {
  const tempDir = join(tmpdir(), `test-clone-repo-${Date.now()}`)
  const repoUrl = 'https://github.com/test/repo.git'
  const commit = 'abc123'

  let capturedRepoUrl: string | undefined
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[]) => {
      if (method === 'exec.exec' && command === 'git' && args[0] === 'remote') {
        capturedRepoUrl = args[2]
        return {
          exitCode: 0,
          stdout: '',
          stderr: '',
        }
      }
      if (method === 'exec.exec') {
        return {
          exitCode: 0,
          stdout: '',
          stderr: '',
        }
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  jest.unstable_mockModule('../src/parts/Exec/Exec.ts', () => ({
    exec: async (command: string, args: string[], options: any) => {
      return mockRpc.invoke('exec.exec', command, args, options)
    },
  }))

  const { cloneRepository } = await import('../src/parts/CloneRepository/CloneRepository.ts')
  await cloneRepository(repoUrl, tempDir, commit)

  expect(capturedRepoUrl).toBe(repoUrl)

  await rm(tempDir, { recursive: true, force: true })
})

test('cloneRepository - handles different commit hashes', async () => {
  const tempDir = join(tmpdir(), `test-clone-repo-${Date.now()}`)
  const repoUrl = 'git@github.com:test/repo.git'
  const commit = 'def456'

  let capturedCommit: string | undefined
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[]) => {
      if (method === 'exec.exec' && command === 'git' && args[0] === 'fetch') {
        capturedCommit = args[args.length - 1]
        return {
          exitCode: 0,
          stdout: '',
          stderr: '',
        }
      }
      if (method === 'exec.exec') {
        return {
          exitCode: 0,
          stdout: '',
          stderr: '',
        }
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  jest.unstable_mockModule('../src/parts/Exec/Exec.ts', () => ({
    exec: async (command: string, args: string[], options: any) => {
      return mockRpc.invoke('exec.exec', command, args, options)
    },
  }))

  const { cloneRepository } = await import('../src/parts/CloneRepository/CloneRepository.ts')
  await cloneRepository(repoUrl, tempDir, commit)

  expect(capturedCommit).toBe(commit)

  await rm(tempDir, { recursive: true, force: true })
})
