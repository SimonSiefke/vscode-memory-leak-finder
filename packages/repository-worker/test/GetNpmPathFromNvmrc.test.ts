import { expect, test } from '@jest/globals'
import { createMockRpc } from '@lvce-editor/rpc'
import { homedir } from 'node:os'
import * as FileSystemWorker from '../src/parts/FileSystemWorker/FileSystemWorker.ts'
import { getNpmPathFromNvmrc } from '../src/parts/GetNpmPathFromNvmrc/GetNpmPathFromNvmrc.ts'
import * as Path from '../src/parts/Path/Path.ts'

test.each([
  ['16.14', false],
  ['16', false],
  ['v16.14', false],
  ['lts/*', false],
  ['16.14', true],
  ['node', true],
])('getNpmPathFromNvmrc - resolves %s to a patch version (already installed: %s)', async (nodeVersion, alreadyInstalled) => {
  const repoPath = '/test/repo'
  const nvmDir = Path.join(homedir(), '.nvm')
  const oldNvmDir = process.env.NVM_DIR
  const binDirectory = Path.join(nvmDir, 'versions', 'node', 'v16.14.2', 'bin')
  const npmPath = Path.join(binDirectory, 'npm')
  let installed = alreadyInstalled
  let installCalls = 0
  process.env.NVM_DIR = nvmDir

  const mockRpc = createMockRpc({
    commandMap: {
      'FileSystem.exec': (command: string, args: readonly string[], options: { reject?: boolean }) => {
        expect(command).toBe('bash')
        expect(args).toEqual(['-c', expect.stringContaining('"$1"'), 'nvm', nodeVersion.replace(/^v/, '')])
        expect(options.reject).toBe(false)
        if (args[1].includes('nvm install')) {
          installCalls++
          installed = true
          return { exitCode: 0, stderr: '', stdout: '' }
        }
        expect(args[1]).toContain('nvm version')
        return { exitCode: installed ? 0 : 3, stderr: '', stdout: installed ? 'v16.14.2\n' : 'N/A\n' }
      },
      'FileSystem.exists': (path: string) =>
        path === `${repoPath}/.nvmrc` || (installed && (path === Path.join(binDirectory, 'node') || path === npmPath)),
      'FileSystem.readFileContent': () => `${nodeVersion}\n`,
    },
  })
  try {
    FileSystemWorker.set(mockRpc)
    await expect(getNpmPathFromNvmrc(repoPath)).resolves.toBe(npmPath)
    expect(installed).toBe(true)
    expect(installCalls).toBe(alreadyInstalled ? 0 : 1)
  } finally {
    if (oldNvmDir === undefined) {
      delete process.env.NVM_DIR
    } else {
      process.env.NVM_DIR = oldNvmDir
    }
  }
})

test('getNpmPathFromNvmrc - returns installed npm path from nvm', async () => {
  const repoPath = '/test/repo'
  const nvmrcPath = `${repoPath}/.nvmrc`
  const homeDir = homedir()
  const oldNvmDir = process.env.NVM_DIR
  const nvmDir = Path.join(homeDir, '.nvm')
  const npmPath = Path.join(nvmDir, 'versions', 'node', 'v22.22.1', 'bin', 'npm')
  const nodePath = Path.join(nvmDir, 'versions', 'node', 'v22.22.1', 'bin', 'node')

  process.env.NVM_DIR = nvmDir

  const mockRpc = createMockRpc({
    commandMap: {
      'FileSystem.exec': () => {
        throw new Error('unexpected exec')
      },
      'FileSystem.exists': (path: string) => path === nvmrcPath || path === nodePath || path === npmPath,
      'FileSystem.readFileContent': () => '22.22.1',
    },
  })
  try {
    FileSystemWorker.set(mockRpc)

    const result = await getNpmPathFromNvmrc(repoPath)

    expect(result).toBe(npmPath)
    expect(mockRpc.invocations).toEqual([
      ['FileSystem.exists', nvmrcPath],
      ['FileSystem.readFileContent', nvmrcPath],
      ['FileSystem.exists', nodePath],
      ['FileSystem.exists', npmPath],
    ])
  } finally {
    process.env.NVM_DIR = oldNvmDir
  }
})

test('getNpmPathFromNvmrc - installs missing node version and resolves npm path', async () => {
  const repoPath = '/test/repo'
  const nvmrcPath = `${repoPath}/.nvmrc`
  const homeDir = homedir()
  const oldNvmDir = process.env.NVM_DIR
  const nvmDir = Path.join(homeDir, '.nvm')
  const configNvmNodePath = Path.join(homeDir, '.config', 'nvm', 'versions', 'node', 'v22.22.1', 'bin', 'node')
  const npmPath = Path.join(nvmDir, 'versions', 'node', 'v22.22.1', 'bin', 'npm')
  const nodePath = Path.join(nvmDir, 'versions', 'node', 'v22.22.1', 'bin', 'node')
  let installed = false

  process.env.NVM_DIR = nvmDir

  const mockRpc = createMockRpc({
    commandMap: {
      'FileSystem.exec': (command: string, args: readonly string[]) => {
        expect(command).toBe('bash')
        expect(args).toEqual(['-c', expect.stringContaining('nvm install "$1"'), 'nvm', '22.22.1'])
        installed = true
        return { exitCode: 0, stderr: '', stdout: '' }
      },
      'FileSystem.exists': (path: string) => {
        if (path === nvmrcPath) {
          return true
        }
        if (path === nodePath || path === npmPath) {
          return installed
        }
        return false
      },
      'FileSystem.readFileContent': () => 'v22.22.1',
    },
  })
  try {
    FileSystemWorker.set(mockRpc)

    const result = await getNpmPathFromNvmrc(repoPath)

    expect(result).toBe(npmPath)
    expect(mockRpc.invocations).toEqual([
      ['FileSystem.exists', nvmrcPath],
      ['FileSystem.readFileContent', nvmrcPath],
      ['FileSystem.exists', nodePath],
      ['FileSystem.exists', configNvmNodePath],
      ['FileSystem.exec', 'bash', ['-c', expect.stringContaining('nvm install "$1"'), 'nvm', '22.22.1'], { reject: false }],
      ['FileSystem.exists', nodePath],
      ['FileSystem.exists', npmPath],
    ])
  } finally {
    process.env.NVM_DIR = oldNvmDir
  }
})

test('getNpmPathFromNvmrc - falls back to parent .nvmrc for nested folders', async () => {
  const repoPath = '/test/repo/build'
  const parentRepoPath = '/test/repo'
  const repoNvmrcPath = `${parentRepoPath}/.nvmrc`
  const buildNvmrcPath = `${repoPath}/.nvmrc`
  const homeDir = homedir()
  const oldNvmDir = process.env.NVM_DIR
  const nvmDir = Path.join(homeDir, '.nvm')
  const npmPath = Path.join(nvmDir, 'versions', 'node', 'v22.22.1', 'bin', 'npm')
  const nodePath = Path.join(nvmDir, 'versions', 'node', 'v22.22.1', 'bin', 'node')

  process.env.NVM_DIR = nvmDir

  const mockRpc = createMockRpc({
    commandMap: {
      'FileSystem.exec': () => {
        throw new Error('unexpected exec')
      },
      'FileSystem.exists': (path: string) => {
        if (path === buildNvmrcPath) {
          return false
        }
        return path === repoNvmrcPath || path === nodePath || path === npmPath
      },
      'FileSystem.readFileContent': (path: string) => {
        expect(path).toBe(repoNvmrcPath)
        return '22.22.1'
      },
    },
  })

  try {
    FileSystemWorker.set(mockRpc)

    const result = await getNpmPathFromNvmrc(repoPath)

    expect(result).toBe(npmPath)
    expect(mockRpc.invocations).toEqual([
      ['FileSystem.exists', buildNvmrcPath],
      ['FileSystem.exists', repoNvmrcPath],
      ['FileSystem.readFileContent', repoNvmrcPath],
      ['FileSystem.exists', nodePath],
      ['FileSystem.exists', npmPath],
    ])
  } finally {
    process.env.NVM_DIR = oldNvmDir
  }
})
