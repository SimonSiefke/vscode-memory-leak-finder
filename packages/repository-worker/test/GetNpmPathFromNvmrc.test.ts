import { homedir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import { createMockRpc } from '@lvce-editor/rpc'
import * as FileSystemWorker from '../src/parts/FileSystemWorker/FileSystemWorker.ts'
import { getNpmPathFromNvmrc } from '../src/parts/GetNpmPathFromNvmrc/GetNpmPathFromNvmrc.ts'

const getNvmDir = (homeDir: string): string => {
  if (process.platform === 'win32') {
    return join(homeDir, 'AppData', 'Roaming', 'nvm')
  }
  return join(homeDir, '.nvm')
}

const getNodeAndNpmPaths = (nvmDir: string, nodeVersion: string): { nodePath: string; npmPath: string } => {
  if (process.platform === 'win32') {
    return {
      nodePath: join(nvmDir, `v${nodeVersion}`, 'node.exe'),
      npmPath: join(nvmDir, `v${nodeVersion}`, 'npm.cmd'),
    }
  }
  return {
    nodePath: join(nvmDir, 'versions', 'node', `v${nodeVersion}`, 'bin', 'node'),
    npmPath: join(nvmDir, 'versions', 'node', `v${nodeVersion}`, 'bin', 'npm'),
  }
}

const getAdditionalNodeProbePaths = (homeDir: string, nodeVersion: string): readonly string[] => {
  if (process.platform === 'win32') {
    return [join(homeDir, '.nvm', `v${nodeVersion}`, 'node.exe'), join(homeDir, '.config', 'nvm', `v${nodeVersion}`, 'node.exe')]
  }
  return [join(homeDir, '.config', 'nvm', 'versions', 'node', `v${nodeVersion}`, 'bin', 'node')]
}

const setStableExecPath = (): (() => void) => {
  const descriptor = Object.getOwnPropertyDescriptor(process, 'execPath')
  Object.defineProperty(process, 'execPath', {
    configurable: true,
    value: process.platform === 'win32' ? 'C:\\Program Files\\nodejs\\node.exe' : '/usr/bin/node',
  })
  return () => {
    if (descriptor) {
      Object.defineProperty(process, 'execPath', descriptor)
    }
  }
}

test('getNpmPathFromNvmrc - returns installed npm path from nvm', async () => {
  const repoPath = '/test/repo'
  const nodeVersion = '22.22.1'
  const homeDir = homedir()
  const oldNvmDir = process.env.NVM_DIR
  const oldNvmHome = process.env.NVM_HOME
  const nvmDir = getNvmDir(homeDir)
  const { nodePath, npmPath } = getNodeAndNpmPaths(nvmDir, nodeVersion)
  const restoreExecPath = setStableExecPath()

  process.env.NVM_DIR = nvmDir
  process.env.NVM_HOME = nvmDir

  const mockRpc = createMockRpc({
    commandMap: {
      'FileSystem.readFileContent': () => nodeVersion,
      'FileSystem.exists': (path: string) => path === nodePath || path === npmPath,
      'FileSystem.exec': () => {
        throw new Error('unexpected exec')
      },
    },
  })
  try {
    FileSystemWorker.set(mockRpc)

    const result = await getNpmPathFromNvmrc(repoPath)

    expect(result).toBe(npmPath)
    expect(mockRpc.invocations).toEqual([
      ['FileSystem.readFileContent', join(repoPath, '.nvmrc')],
      ['FileSystem.exists', nodePath],
      ['FileSystem.exists', npmPath],
    ])
  } finally {
    process.env.NVM_DIR = oldNvmDir
    process.env.NVM_HOME = oldNvmHome
    restoreExecPath()
  }
})

test('getNpmPathFromNvmrc - installs missing node version and resolves npm path', async () => {
  const repoPath = '/test/repo'
  const nodeVersion = '22.22.1'
  const homeDir = homedir()
  const oldNvmDir = process.env.NVM_DIR
  const oldNvmHome = process.env.NVM_HOME
  const nvmDir = getNvmDir(homeDir)
  const { nodePath, npmPath } = getNodeAndNpmPaths(nvmDir, nodeVersion)
  const additionalNodeProbePaths = getAdditionalNodeProbePaths(homeDir, nodeVersion)
  const restoreExecPath = setStableExecPath()
  let installed = false

  process.env.NVM_DIR = nvmDir
  process.env.NVM_HOME = nvmDir

  const mockRpc = createMockRpc({
    commandMap: {
      'FileSystem.readFileContent': () => `v${nodeVersion}`,
      'FileSystem.exists': (path: string) => {
        if (path === nodePath || path === npmPath) {
          return installed
        }
        return false
      },
      'FileSystem.exec': (command: string, args: readonly string[]) => {
        if (process.platform === 'win32') {
          expect(command).toBe(join(nvmDir, 'nvm.exe'))
          expect(args).toEqual(['install', nodeVersion])
        } else {
          expect(command).toBe('bash')
          expect(args).toEqual(['-c', expect.stringContaining(`nvm install ${nodeVersion}`)])
        }
        installed = true
        return { exitCode: 0, stderr: '', stdout: '' }
      },
    },
  })
  try {
    FileSystemWorker.set(mockRpc)

    const result = await getNpmPathFromNvmrc(repoPath)

    expect(result).toBe(npmPath)
    expect(mockRpc.invocations).toEqual([
      ['FileSystem.readFileContent', join(repoPath, '.nvmrc')],
      ['FileSystem.exists', nodePath],
      ...additionalNodeProbePaths.map((path) => ['FileSystem.exists', path]),
      process.platform === 'win32'
        ? ['FileSystem.exec', join(nvmDir, 'nvm.exe'), ['install', nodeVersion], {}]
        : ['FileSystem.exec', 'bash', ['-c', expect.stringContaining(`nvm install ${nodeVersion}`)], {}],
      ['FileSystem.exists', nodePath],
      ['FileSystem.exists', npmPath],
    ])
  } finally {
    process.env.NVM_DIR = oldNvmDir
    process.env.NVM_HOME = oldNvmHome
    restoreExecPath()
  }
})
