import { beforeEach, expect, jest, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

beforeEach(() => {
  jest.resetModules()
})

test('findCommitForVersion - finds commit from exact tag', async () => {
  const tempDir = join(tmpdir(), `test-find-commit-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  const version = '1.0.0'
  const expectedCommit = 'abc123def456'
  let invocationCount = 0

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[]) => {
      invocationCount++
      if (method === 'exec.exec' && command === 'git') {
        if (args[0] === 'tag' && args[1] === '-l') {
          return {
            exitCode: 0,
            stderr: '',
            stdout: version,
          }
        }
        if (args[0] === 'rev-parse') {
          return {
            exitCode: 0,
            stderr: '',
            stdout: expectedCommit,
          }
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

  const { findCommitForVersion } = await import('../src/parts/FindCommitForVersion/FindCommitForVersion.ts')
  const commit = await findCommitForVersion(tempDir, version)

  expect(commit).toBe(expectedCommit)
  expect(invocationCount).toBe(2)

  await rm(tempDir, { force: true, recursive: true })
})

test('findCommitForVersion - finds commit from tag that includes version', async () => {
  const tempDir = join(tmpdir(), `test-find-commit-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  const version = '1.0.0'
  const matchingTag = 'v1.0.0'
  const expectedCommit = 'abc123def456'
  let invocationCount = 0

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[]) => {
      invocationCount++
      if (method === 'exec.exec' && command === 'git') {
        if (args[0] === 'tag' && args[1] === '-l') {
          return {
            exitCode: 0,
            stderr: '',
            stdout: `v0.9.0\n${matchingTag}\nv1.1.0`,
          }
        }
        if (args[0] === 'rev-parse') {
          return {
            exitCode: 0,
            stderr: '',
            stdout: expectedCommit,
          }
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

  const { findCommitForVersion } = await import('../src/parts/FindCommitForVersion/FindCommitForVersion.ts')
  const commit = await findCommitForVersion(tempDir, version)

  expect(commit).toBe(expectedCommit)
  expect(invocationCount).toBe(2)

  await rm(tempDir, { force: true, recursive: true })
})

test('findCommitForVersion - finds commit from git log grep', async () => {
  const tempDir = join(tmpdir(), `test-find-commit-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  const version = '1.0.0'
  const expectedCommit = 'abc123'
  let invocationCount = 0

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[]) => {
      invocationCount++
      if (method === 'exec.exec' && command === 'git') {
        if (args[0] === 'tag' && args[1] === '-l') {
          return {
            exitCode: 0,
            stderr: '',
            stdout: '',
          }
        }
        if (args[0] === 'log') {
          return {
            exitCode: 0,
            stderr: '',
            stdout: `${expectedCommit} Update version to ${version}`,
          }
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

  const { findCommitForVersion } = await import('../src/parts/FindCommitForVersion/FindCommitForVersion.ts')
  const commit = await findCommitForVersion(tempDir, version)

  expect(commit).toBe(expectedCommit)
  expect(invocationCount).toBe(2)

  await rm(tempDir, { force: true, recursive: true })
})

test('findCommitForVersion - finds commit from package.json version', async () => {
  const tempDir = join(tmpdir(), `test-find-commit-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  const version = '1.0.0'
  const expectedCommit = 'abc123'
  let invocationCount = 0

  const packageJson = {
    version: version,
  }
  await writeFile(join(tempDir, 'package.json'), JSON.stringify(packageJson))

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[]) => {
      invocationCount++
      if (method === 'exec.exec' && command === 'git') {
        if (args[0] === 'tag' && args[1] === '-l') {
          return {
            exitCode: 0,
            stderr: '',
            stdout: '',
          }
        }
        if (args[0] === 'log') {
          return {
            exitCode: 0,
            stderr: '',
            stdout: '',
          }
        }
        if (args[0] === 'rev-parse' && args[1] === 'HEAD') {
          return {
            exitCode: 0,
            stderr: '',
            stdout: expectedCommit,
          }
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

  const { findCommitForVersion } = await import('../src/parts/FindCommitForVersion/FindCommitForVersion.ts')
  const commit = await findCommitForVersion(tempDir, version)

  expect(commit).toBe(expectedCommit)
  expect(invocationCount).toBe(3)

  await rm(tempDir, { force: true, recursive: true })
})

test('findCommitForVersion - throws error when commit cannot be found', async () => {
  const tempDir = join(tmpdir(), `test-find-commit-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  const version = '999.999.999'

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[]) => {
      if (method === 'exec.exec' && command === 'git') {
        if (args[0] === 'tag' && args[1] === '-l') {
          return {
            exitCode: 0,
            stderr: '',
            stdout: '',
          }
        }
        if (args[0] === 'log') {
          return {
            exitCode: 0,
            stderr: '',
            stdout: '',
          }
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

  const { findCommitForVersion } = await import('../src/parts/FindCommitForVersion/FindCommitForVersion.ts')
  await expect(findCommitForVersion(tempDir, version)).rejects.toThrow(`Could not find commit for version ${version}`)

  await rm(tempDir, { force: true, recursive: true })
})

test('findCommitForVersion - throws VError when git command fails', async () => {
  const tempDir = join(tmpdir(), `test-find-commit-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  const version = '1.0.0'

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string) => {
      if (method === 'exec.exec' && command === 'git') {
        throw new Error('git command failed')
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  jest.unstable_mockModule('../src/parts/Exec/Exec.ts', () => ({
    exec: async (command: string, args: string[], options: any) => {
      return mockRpc.invoke('exec.exec', command, args, options)
    },
  }))

  const { findCommitForVersion } = await import('../src/parts/FindCommitForVersion/FindCommitForVersion.ts')
  await expect(findCommitForVersion(tempDir, version)).rejects.toThrow(`Failed to find commit for version '${version}'`)

  await rm(tempDir, { force: true, recursive: true })
})

test('findCommitForVersion - handles package.json with different version', async () => {
  const tempDir = join(tmpdir(), `test-find-commit-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  const version = '1.0.0'

  const packageJson = {
    version: '2.0.0',
  }
  await writeFile(join(tempDir, 'package.json'), JSON.stringify(packageJson))

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[]) => {
      if (method === 'exec.exec' && command === 'git') {
        if (args[0] === 'tag' && args[1] === '-l') {
          return {
            exitCode: 0,
            stderr: '',
            stdout: '',
          }
        }
        if (args[0] === 'log') {
          return {
            exitCode: 0,
            stderr: '',
            stdout: '',
          }
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

  const { findCommitForVersion } = await import('../src/parts/FindCommitForVersion/FindCommitForVersion.ts')
  await expect(findCommitForVersion(tempDir, version)).rejects.toThrow(`Could not find commit for version ${version}`)

  await rm(tempDir, { force: true, recursive: true })
})
