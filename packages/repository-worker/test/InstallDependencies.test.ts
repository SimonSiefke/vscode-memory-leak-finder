import { homedir } from 'node:os'
import { delimiter, dirname, join } from 'node:path'
import { test, expect, jest } from '@jest/globals'
import { MockRpc, createMockRpc } from '@lvce-editor/rpc'
import { VError } from '@lvce-editor/verror'
import * as FileSystemWorker from '../src/parts/FileSystemWorker/FileSystemWorker.ts'
import { installDependencies } from '../src/parts/InstallDependencies/InstallDependencies.ts'

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

test('installDependencies - runs npm ci without nice', async () => {
  const mockInvoke = jest.fn()
  mockInvoke.mockImplementation((method) => {
    if (method === 'FileSystem.readFileContent') {
      return '20'
    }
    if (method === 'FileSystem.exists') {
      return true
    }
    if (method === 'FileSystem.exec') {
      return { exitCode: 0, stderr: '', stdout: '' }
    }
    throw new Error(`unexpected method ${method}`)
  })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  await installDependencies('/test/path', false)

  expect(mockInvoke).toHaveBeenCalled()
})

test('installDependencies - runs npm ci with nice', async () => {
  const mockInvoke = jest.fn()
  mockInvoke.mockImplementation((method) => {
    if (method === 'FileSystem.readFileContent') {
      return '20'
    }
    if (method === 'FileSystem.exists') {
      return true
    }
    if (method === 'FileSystem.exec') {
      return { exitCode: 0, stderr: '', stdout: '' }
    }
    throw new Error(`unexpected method ${method}`)
  })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  await installDependencies('/test/path', true)

  expect(mockInvoke).toHaveBeenCalled()
})

test('installDependencies - throws VError when exec fails without nice', async () => {
  const mockInvoke = jest.fn()
  mockInvoke.mockImplementation((method) => {
    if (method === 'FileSystem.readFileContent') {
      return '20'
    }
    if (method === 'FileSystem.exists') {
      return true
    }
    if (method === 'FileSystem.exec') {
      throw new Error('npm ci failed')
    }
    throw new Error(`unexpected method ${method}`)
  })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  await expect(installDependencies('/test/path', false)).rejects.toThrow(VError)
  await expect(installDependencies('/test/path', false)).rejects.toThrow("Failed to install dependencies in directory '/test/path'")
  expect(mockInvoke).toHaveBeenCalled()
})

test('installDependencies - throws VError when exec fails with nice', async () => {
  const mockInvoke = jest.fn()
  mockInvoke.mockImplementation((method) => {
    if (method === 'FileSystem.readFileContent') {
      return '20'
    }
    if (method === 'FileSystem.exists') {
      return true
    }
    if (method === 'FileSystem.exec') {
      throw new Error('nice command failed')
    }
    throw new Error(`unexpected method ${method}`)
  })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })
  FileSystemWorker.set(mockRpc)

  await expect(installDependencies('/test/path', true)).rejects.toThrow(VError)
  await expect(installDependencies('/test/path', true)).rejects.toThrow("Failed to install dependencies in directory '/test/path'")
  expect(mockInvoke).toHaveBeenCalled()
})

test('installDependencies - installs missing node version from .nvmrc before npm ci', async () => {
  const repoPath = '/test/path'
  const nodeVersion = '22.22.1'
  const homeDir = homedir()
  const oldNvmDir = process.env.NVM_DIR
  const oldNvmHome = process.env.NVM_HOME
  const nvmDir = getNvmDir(homeDir)
  const { nodePath, npmPath } = getNodeAndNpmPaths(nvmDir, nodeVersion)
  const npmBinDirectory = dirname(npmPath)
  const additionalNodeProbePaths = getAdditionalNodeProbePaths(homeDir, nodeVersion)
  const restoreExecPath = setStableExecPath()
  let installed = false

  process.env.NVM_DIR = nvmDir
  process.env.NVM_HOME = nvmDir

  const mockRpc = createMockRpc({
    commandMap: {
      'FileSystem.readFileContent': () => nodeVersion,
      'FileSystem.exists': (path: string) => {
        if (path === nodePath || path === npmPath) {
          return installed
        }
        return false
      },
      'FileSystem.exec': (
        command: string,
        args: readonly string[],
        options: { cwd?: string; env?: Record<string, string | undefined> },
      ) => {
        if (process.platform === 'win32' && command === join(nvmDir, 'nvm.exe')) {
          expect(args).toEqual(['install', nodeVersion])
          installed = true
          return { exitCode: 0, stderr: '', stdout: '' }
        }
        if (process.platform !== 'win32' && command === 'bash') {
          expect(args).toEqual(['-c', expect.stringContaining(`nvm install ${nodeVersion}`)])
          installed = true
          return { exitCode: 0, stderr: '', stdout: '' }
        }
        expect(command).toBe(npmPath)
        expect(args).toEqual(['ci'])
        expect(options.cwd).toBe(repoPath)
        expect(options.env?.PATH).toContain(npmBinDirectory)
        expect(options.env?.PATH?.split(delimiter)[0]).toBe(npmBinDirectory)
        return { exitCode: 0, stderr: '', stdout: '' }
      },
    },
  })
  try {
    FileSystemWorker.set(mockRpc)

    await installDependencies(repoPath, false)

    expect(mockRpc.invocations).toEqual([
      ['FileSystem.readFileContent', join(repoPath, '.nvmrc')],
      ['FileSystem.exists', nodePath],
      ...additionalNodeProbePaths.map((path) => ['FileSystem.exists', path]),
      process.platform === 'win32'
        ? ['FileSystem.exec', join(nvmDir, 'nvm.exe'), ['install', nodeVersion], {}]
        : ['FileSystem.exec', 'bash', ['-c', expect.stringContaining(`nvm install ${nodeVersion}`)], {}],
      ['FileSystem.exists', nodePath],
      ['FileSystem.exists', npmPath],
      [
        'FileSystem.exec',
        npmPath,
        ['ci'],
        {
          cwd: repoPath,
          env: expect.objectContaining({
            PATH: expect.stringContaining(
              process.platform === 'win32' ? join(nvmDir, `v${nodeVersion}`) : join(nvmDir, 'versions', 'node', `v${nodeVersion}`, 'bin'),
            ),
          }),
          stdio: 'inherit',
        },
      ],
    ])
  } finally {
    process.env.NVM_DIR = oldNvmDir
    process.env.NVM_HOME = oldNvmHome
    restoreExecPath()
  }
})
