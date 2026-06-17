import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { tmpdir } from 'node:os'
import { test, expect, jest } from '@jest/globals'
import { MockRpc, createMockRpc } from '@lvce-editor/rpc'
import { VError } from '@lvce-editor/verror'
import * as FileSystemWorker from '../src/parts/FileSystemWorker/FileSystemWorker.ts'
import * as Path from '../src/parts/Path/Path.ts'
import { ensureNestedDependencies, installDependencies } from '../src/parts/InstallDependencies/InstallDependencies.ts'

test('installDependencies - runs npm ci without nice', async () => {
  const mockInvoke = jest.fn()
  mockInvoke.mockImplementation((method) => {
    if (method === 'FileSystem.readFileContent') {
      return '20'
    }
    if (method === 'FileSystem.exists') {
      return true
    }
    if (method === 'FileSystem.findFiles') {
      return []
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
    if (method === 'FileSystem.findFiles') {
      return []
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
    if (method === 'FileSystem.findFiles') {
      return []
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
    if (method === 'FileSystem.findFiles') {
      return []
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
  const nvmrcPath = `${repoPath}/.nvmrc`
  const homeDir = homedir()
  const oldNvmDir = process.env.NVM_DIR
  const nvmDir = Path.join(homeDir, '.nvm')
  const binPath = Path.join(nvmDir, 'versions', 'node', 'v22.22.1', 'bin')
  const configNvmNodePath = Path.join(homeDir, '.config', 'nvm', 'versions', 'node', 'v22.22.1', 'bin', 'node')
  const npmPath = Path.join(binPath, 'npm')
  const nodePath = Path.join(binPath, 'node')
  let installed = false

  process.env.NVM_DIR = nvmDir

  const mockRpc = createMockRpc({
    commandMap: {
      'FileSystem.readFileContent': () => '22.22.1',
      'FileSystem.exists': (path: string) => {
        if (path === nvmrcPath) {
          return true
        }
        if (path === nodePath || path === npmPath) {
          return installed
        }
        if (path === `${repoPath}/build/package.json`) {
          return false
        }
        return false
      },
      'FileSystem.findFiles': () => [],
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
        expect(options.env?.PATH).toContain(binPath)
        return { exitCode: 0, stderr: '', stdout: '' }
      },
    },
  })
  try {
    FileSystemWorker.set(mockRpc)

    await installDependencies(repoPath, false)

    expect(mockRpc.invocations).toEqual([
      ['FileSystem.exists', nvmrcPath],
      ['FileSystem.readFileContent', nvmrcPath],
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
            PATH: expect.stringContaining(binPath),
          }),
          stdio: 'inherit',
        },
      ],
      [
        'FileSystem.findFiles',
        ['**/package-lock.json', '.vscode/**/package-lock.json'],
        { cwd: repoPath, exclude: ['**/node_modules/**'] },
      ],
    ])
  } finally {
    process.env.NVM_DIR = oldNvmDir
  }
})

test('installDependencies - runs npm ci in nested package folders when dependencies are missing', async () => {
  const repoPath = '/test/path'
  const buildPath = `${repoPath}/build`
  const extensionPath = `${repoPath}/extensions/esbuild-simple-browser`
  const repoNvmrcPath = `${repoPath}/.nvmrc`
  const buildNvmrcPath = `${buildPath}/.nvmrc`
  const extensionNvmrcPath = `${extensionPath}/.nvmrc`
  const oldNvmDir = process.env.NVM_DIR
  process.env.NVM_DIR = '/test/.nvm'
  const npmPath = '/test/.nvm/versions/node/v20.0.0/bin/npm'
  const nodePath = '/test/.nvm/versions/node/v20.0.0/bin/node'

  const mockRpc = createMockRpc({
    commandMap: {
      'FileSystem.readFileContent': (path: string) => {
        if (path === repoNvmrcPath) {
          return '20.0.0'
        }
        throw new Error(`unexpected read ${path}`)
      },
      'FileSystem.exists': (path: string) => {
        if (path === nodePath || path === npmPath) {
          return true
        }
        if (path === repoNvmrcPath) {
          return true
        }
        if (path === buildNvmrcPath) {
          return false
        }
        if (path === extensionNvmrcPath) {
          return false
        }
        if (path === `${buildPath}/package.json`) {
          return true
        }
        if (path === `${buildPath}/node_modules`) {
          return false
        }
        if (path === `${extensionPath}/package.json`) {
          return true
        }
        if (path === `${extensionPath}/node_modules`) {
          return false
        }
        return false
      },
      'FileSystem.exec': (command: string, args: readonly string[], options: { cwd?: string }) => {
        expect(command).toBe(npmPath)
        expect(args).toEqual(['ci'])
        expect([repoPath, buildPath, extensionPath]).toContain(options.cwd)
        return { exitCode: 0, stderr: '', stdout: '' }
      },
      'FileSystem.findFiles': () => ['build/package-lock.json', 'extensions/esbuild-simple-browser/package-lock.json'],
    },
  })

  try {
    FileSystemWorker.set(mockRpc)

    await installDependencies(repoPath, false)

    expect(mockRpc.invocations).toEqual([
      ['FileSystem.exists', repoNvmrcPath],
      ['FileSystem.readFileContent', repoNvmrcPath],
      ['FileSystem.exists', nodePath],
      ['FileSystem.exists', npmPath],
      [
        'FileSystem.exec',
        npmPath,
        ['ci'],
        {
          cwd: repoPath,
          env: expect.objectContaining({
            PATH: expect.stringContaining('/test/.nvm/versions/node/v20.0.0/bin'),
          }),
          stdio: 'inherit',
        },
      ],
      [
        'FileSystem.findFiles',
        ['**/package-lock.json', '.vscode/**/package-lock.json'],
        { cwd: repoPath, exclude: ['**/node_modules/**'] },
      ],
      ['FileSystem.exists', `${buildPath}/package.json`],
      ['FileSystem.exists', `${buildPath}/node_modules`],
      ['FileSystem.exists', buildNvmrcPath],
      ['FileSystem.exists', repoNvmrcPath],
      ['FileSystem.readFileContent', repoNvmrcPath],
      ['FileSystem.exists', nodePath],
      ['FileSystem.exists', npmPath],
      [
        'FileSystem.exec',
        npmPath,
        ['ci'],
        {
          cwd: buildPath,
          env: expect.objectContaining({
            PATH: expect.stringContaining('/test/.nvm/versions/node/v20.0.0/bin'),
          }),
          stdio: 'inherit',
        },
      ],
      ['FileSystem.exists', `${extensionPath}/package.json`],
      ['FileSystem.exists', `${extensionPath}/node_modules`],
      ['FileSystem.exists', extensionNvmrcPath],
      ['FileSystem.exists', `${repoPath}/extensions/.nvmrc`],
      ['FileSystem.exists', repoNvmrcPath],
      ['FileSystem.readFileContent', repoNvmrcPath],
      ['FileSystem.exists', nodePath],
      ['FileSystem.exists', npmPath],
      [
        'FileSystem.exec',
        npmPath,
        ['ci'],
        {
          cwd: extensionPath,
          env: expect.objectContaining({
            PATH: expect.stringContaining('/test/.nvm/versions/node/v20.0.0/bin'),
          }),
          stdio: 'inherit',
        },
      ],
    ])
  } finally {
    process.env.NVM_DIR = oldNvmDir
  }
})

test('ensureNestedDependencies - skips nested folders without package.json', async () => {
  const repoPath = '/test/path'
  const nestedPath = `${repoPath}/extensions/esbuild-simple-browser`
  const mockRpc = createMockRpc({
    commandMap: {
      'FileSystem.findFiles': () => ['extensions/esbuild-simple-browser/package-lock.json'],
      'FileSystem.exists': (path: string) => {
        if (path === `${nestedPath}/package.json`) {
          return false
        }
        throw new Error(`unexpected exists ${path}`)
      },
    },
  })

  FileSystemWorker.set(mockRpc)

  await expect(ensureNestedDependencies(repoPath, false)).resolves.toBe(0)
  expect(mockRpc.invocations).toEqual([
    ['FileSystem.findFiles', ['**/package-lock.json', '.vscode/**/package-lock.json'], { cwd: repoPath, exclude: ['**/node_modules/**'] }],
    ['FileSystem.exists', `${nestedPath}/package.json`],
  ])
})

test('ensureNestedDependencies - reinstalls nested dependencies when existing node_modules is incomplete', async () => {
  const repoPath = await mkdtemp(Path.join(tmpdir(), 'repository-worker-install-deps-'))
  const nestedPath = `${repoPath}/.vscode/extensions/vscode-selfhost-test-provider`
  const repoNvmrcPath = `${repoPath}/.nvmrc`
  const nestedNvmrcPath = `${nestedPath}/.nvmrc`
  const npmPath = '/test/.nvm/versions/node/v20.0.0/bin/npm'
  const nodePath = '/test/.nvm/versions/node/v20.0.0/bin/node'
  const oldNvmDir = process.env.NVM_DIR
  process.env.NVM_DIR = '/test/.nvm'

  await mkdir(`${nestedPath}/node_modules`, { recursive: true })
  await writeFile(repoNvmrcPath, '20.0.0')
  await writeFile(
    `${nestedPath}/package-lock.json`,
    JSON.stringify({
      packages: {
        '': {
          dependencies: {
            cockatiel: '^3.1.3',
          },
        },
      },
    }),
  )
  await writeFile(`${nestedPath}/package.json`, JSON.stringify({ name: 'vscode-selfhost-test-provider' }))
  await writeFile(`${nestedPath}/node_modules/.package-lock.json`, '{}')

  const mockRpc = createMockRpc({
    commandMap: {
      'FileSystem.findFiles': () => ['.vscode/extensions/vscode-selfhost-test-provider/package-lock.json'],
      'FileSystem.exists': (path: string) => {
        if (path === `${nestedPath}/package.json`) {
          return true
        }
        if (path === `${nestedPath}/node_modules`) {
          return true
        }
        if (path === repoNvmrcPath) {
          return true
        }
        if (path === nestedNvmrcPath) {
          return false
        }
        if (path === nodePath || path === npmPath) {
          return true
        }
        return false
      },
      'FileSystem.readFileContent': (path: string) => {
        if (path === repoNvmrcPath) {
          return '20.0.0'
        }
        throw new Error(`unexpected read ${path}`)
      },
      'FileSystem.exec': (
        command: string,
        args: readonly string[],
        options: { cwd?: string; env?: Record<string, string | undefined> },
      ) => {
        expect(command).toBe(npmPath)
        expect(args).toEqual(['ci'])
        expect(options.cwd).toBe(nestedPath)
        expect(options.env?.PATH).toContain('/test/.nvm/versions/node/v20.0.0/bin')
        return { exitCode: 0, stderr: '', stdout: '' }
      },
    },
  })

  try {
    FileSystemWorker.set(mockRpc)

    await expect(ensureNestedDependencies(repoPath, false)).resolves.toBe(1)
    expect(mockRpc.invocations).toContainEqual([
      'FileSystem.findFiles',
      ['**/package-lock.json', '.vscode/**/package-lock.json'],
      { cwd: repoPath, exclude: ['**/node_modules/**'] },
    ])
    expect(mockRpc.invocations).toContainEqual(['FileSystem.exists', `${nestedPath}/package.json`])
    expect(mockRpc.invocations).toContainEqual(['FileSystem.exists', `${nestedPath}/node_modules`])
    expect(mockRpc.invocations).toContainEqual(['FileSystem.exists', nestedNvmrcPath])
    expect(mockRpc.invocations).toContainEqual(['FileSystem.exists', repoNvmrcPath])
    expect(mockRpc.invocations).toContainEqual(['FileSystem.readFileContent', repoNvmrcPath])
    expect(mockRpc.invocations).toContainEqual(['FileSystem.exists', nodePath])
    expect(mockRpc.invocations).toContainEqual(['FileSystem.exists', npmPath])
    expect(mockRpc.invocations).toContainEqual([
      'FileSystem.exec',
      npmPath,
      ['ci'],
      {
        cwd: nestedPath,
        env: expect.objectContaining({
          PATH: expect.stringContaining('/test/.nvm/versions/node/v20.0.0/bin'),
        }),
        stdio: 'inherit',
      },
    ])
  } finally {
    process.env.NVM_DIR = oldNvmDir
    await rm(repoPath, { force: true, recursive: true })
  }
})

test('ensureNestedDependencies - installs copilot and chat-lib dependencies without extraction', async () => {
  const repoPath = '/test/path'
  const copilotPath = `${repoPath}/extensions/copilot`
  const copilotNestedPath = `${repoPath}/extensions/copilot/chat-lib`
  const repoNvmrcPath = `${repoPath}/.nvmrc`
  const copilotNvmrcPath = `${copilotPath}/.nvmrc`
  const chatLibNvmrcPath = `${copilotNestedPath}/.nvmrc`
  const extensionsNvmrcPath = `${repoPath}/extensions/.nvmrc`
  const oldNvmDir = process.env.NVM_DIR
  process.env.NVM_DIR = '/test/.nvm'
  const npmPath = '/test/.nvm/versions/node/v20.0.0/bin/npm'
  const nodePath = '/test/.nvm/versions/node/v20.0.0/bin/node'
  let copilotInstalled = false
  const mockRpc = createMockRpc({
    commandMap: {
      'FileSystem.findFiles': () => ['extensions/copilot/package-lock.json', 'extensions/copilot/chat-lib/package-lock.json'],
      'FileSystem.exists': (path: string) => {
        if (path === repoNvmrcPath) {
          return true
        }
        if (path === nodePath || path === npmPath) {
          return true
        }
        if (path === `${copilotPath}/package.json`) {
          return true
        }
        if (path === `${copilotPath}/node_modules`) {
          return copilotInstalled
        }
        if (path === `${copilotNestedPath}/package.json`) {
          return true
        }
        if (path === `${copilotNestedPath}/node_modules`) {
          return false
        }
        if (path === chatLibNvmrcPath || path === copilotNvmrcPath || path === extensionsNvmrcPath) {
          return false
        }
        throw new Error(`unexpected exists ${path}`)
      },
      'FileSystem.readFileContent': (path: string) => {
        if (path === repoNvmrcPath) {
          return '20.0.0'
        }
        throw new Error(`unexpected read ${path}`)
      },
      'FileSystem.exec': (command: string, args: readonly string[], options: { cwd?: string }) => {
        expect(command).toBe(npmPath)
        if (options.cwd === copilotPath && args[0] === 'ci') {
          copilotInstalled = true
          return { exitCode: 0, stderr: '', stdout: '' }
        }
        if (options.cwd === copilotNestedPath) {
          expect(args).toEqual(['ci', '--ignore-scripts'])
          return { exitCode: 0, stderr: '', stdout: '' }
        }
        expect(args).toEqual(['ci'])
        expect([copilotPath]).toContain(options.cwd)
        return { exitCode: 0, stderr: '', stdout: '' }
      },
    },
  })

  try {
    FileSystemWorker.set(mockRpc)

    await expect(ensureNestedDependencies(repoPath, false)).resolves.toBe(2)
    expect(mockRpc.invocations).toEqual([
      [
        'FileSystem.findFiles',
        ['**/package-lock.json', '.vscode/**/package-lock.json'],
        { cwd: repoPath, exclude: ['**/node_modules/**'] },
      ],
      ['FileSystem.exists', `${copilotPath}/package.json`],
      ['FileSystem.exists', `${copilotPath}/node_modules`],
      ['FileSystem.exists', copilotNvmrcPath],
      ['FileSystem.exists', extensionsNvmrcPath],
      ['FileSystem.exists', repoNvmrcPath],
      ['FileSystem.readFileContent', repoNvmrcPath],
      ['FileSystem.exists', nodePath],
      ['FileSystem.exists', npmPath],
      [
        'FileSystem.exec',
        npmPath,
        ['ci'],
        {
          cwd: copilotPath,
          env: expect.objectContaining({
            PATH: expect.stringContaining('/test/.nvm/versions/node/v20.0.0/bin'),
          }),
          stdio: 'inherit',
        },
      ],
      ['FileSystem.exists', `${copilotNestedPath}/package.json`],
      ['FileSystem.exists', `${copilotNestedPath}/node_modules`],
      ['FileSystem.exists', chatLibNvmrcPath],
      ['FileSystem.exists', copilotNvmrcPath],
      ['FileSystem.exists', extensionsNvmrcPath],
      ['FileSystem.exists', repoNvmrcPath],
      ['FileSystem.readFileContent', repoNvmrcPath],
      ['FileSystem.exists', nodePath],
      ['FileSystem.exists', npmPath],
      [
        'FileSystem.exec',
        npmPath,
        ['ci', '--ignore-scripts'],
        {
          cwd: copilotNestedPath,
          env: expect.objectContaining({
            PATH: expect.stringContaining('/test/.nvm/versions/node/v20.0.0/bin'),
          }),
          stdio: 'inherit',
        },
      ],
    ])
  } finally {
    process.env.NVM_DIR = oldNvmDir
  }
})
