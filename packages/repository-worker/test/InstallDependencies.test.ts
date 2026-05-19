import { homedir } from 'node:os'
import { test, expect, jest } from '@jest/globals'
import { MockRpc, createMockRpc } from '@lvce-editor/rpc'
import { VError } from '@lvce-editor/verror'
import * as FileSystemWorker from '../src/parts/FileSystemWorker/FileSystemWorker.ts'
import { installDependencies } from '../src/parts/InstallDependencies/InstallDependencies.ts'

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
  const homeDir = homedir()
  const oldNvmDir = process.env.NVM_DIR
  const nvmDir = `${homeDir}/.nvm`
  const configNvmNodePath = `${homeDir}/.config/nvm/versions/node/v22.22.1/bin/node`
  const npmPath = `${nvmDir}/versions/node/v22.22.1/bin/npm`
  const nodePath = `${nvmDir}/versions/node/v22.22.1/bin/node`
  let installed = false

  process.env.NVM_DIR = nvmDir

  const mockRpc = createMockRpc({
    commandMap: {
      'FileSystem.readFileContent': () => '22.22.1',
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
        if (command === 'bash') {
          expect(args).toEqual(['-c', expect.stringContaining('nvm install 22.22.1')])
          installed = true
          return { exitCode: 0, stderr: '', stdout: '' }
        }
        expect(command).toBe(npmPath)
        expect(args).toEqual(['ci'])
        expect(options.cwd).toBe(repoPath)
        expect(options.env?.PATH).toContain(`${nvmDir}/versions/node/v22.22.1/bin`)
        return { exitCode: 0, stderr: '', stdout: '' }
      },
    },
  })
  try {
    FileSystemWorker.set(mockRpc)

    await installDependencies(repoPath, false)

    expect(mockRpc.invocations).toEqual([
      ['FileSystem.readFileContent', `${repoPath}/.nvmrc`],
      ['FileSystem.exists', nodePath],
      ['FileSystem.exists', configNvmNodePath],
      ['FileSystem.exec', 'bash', ['-c', expect.stringContaining('nvm install 22.22.1')], {}],
      ['FileSystem.exists', nodePath],
      ['FileSystem.exists', npmPath],
      [
        'FileSystem.exec',
        npmPath,
        ['ci'],
        {
          cwd: repoPath,
          env: expect.objectContaining({
            PATH: expect.stringContaining(`${nvmDir}/versions/node/v22.22.1/bin`),
          }),
          stdio: 'inherit',
        },
      ],
    ])
  } finally {
    process.env.NVM_DIR = oldNvmDir
  }
})
