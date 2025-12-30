import { beforeEach, expect, jest, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import { existsSync } from 'node:fs'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as GenerateExtensionSourceMaps from '../src/parts/GenerateExtensionSourceMaps/GenerateExtensionSourceMaps.ts'

beforeEach(() => {
  jest.resetModules()
})

test.skip('generateExtensionSourceMaps - skips when source maps already exist', async () => {
  const tempOutput = join(tmpdir(), `test-generate-${Date.now()}`)
  const tempCache = join(tmpdir(), `test-cache-${Date.now()}`)
  const extensionName = 'test-extension'
  const version = '1.0.0'

  const sourceMapsOutputPath = join(tempOutput, `${extensionName}-${version}`)
  await mkdir(sourceMapsOutputPath, { recursive: true })

  await GenerateExtensionSourceMaps.generateExtensionSourceMaps({
    cacheDir: tempCache,
    extensionName,
    outputDir: tempOutput,
    repoUrl: 'git@github.com:test/repo.git',
    version,
  })

  expect(existsSync(sourceMapsOutputPath)).toBe(true)

  await rm(tempOutput, { force: true, recursive: true })
  await rm(tempCache, { force: true, recursive: true })
})

test.skip('generateExtensionSourceMaps - clones repository when it does not exist', async () => {
  const tempOutput = join(tmpdir(), `test-generate-${Date.now()}`)
  const tempCache = join(tmpdir(), `test-cache-${Date.now()}`)
  const extensionName = 'test-extension'
  const version = '1.0.0'
  const repoUrl = 'git@github.com:test/repo.git'

  const repoPath = join(tempCache, `${extensionName}-${version}`)

  let cloneCalled = false
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[]) => {
      if (method === 'exec.exec' && command === 'git') {
        return {
          exitCode: 0,
          stderr: '',
          stdout: '',
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

  jest.unstable_mockModule('../src/parts/CloneRepository/CloneRepository.ts', () => ({
    cloneRepository: async (url: string, path: string) => {
      cloneCalled = true
      expect(url).toBe(repoUrl)
      expect(path).toBe(repoPath)
    },
  }))

  jest.unstable_mockModule('../src/parts/FindCommitForVersion/FindCommitForVersion.ts', () => ({
    findCommitForVersion: async () => 'abc123',
  }))

  jest.unstable_mockModule('../src/parts/GetNodeVersion/GetNodeVersion.ts', () => ({
    getNodeVersion: async () => '18.0.0',
  }))

  jest.unstable_mockModule('../src/parts/InstallNodeVersion/InstallNodeVersion.ts', () => ({
    installNodeVersion: async () => 'v18.0.0',
  }))

  jest.unstable_mockModule('../src/parts/InstallDependencies/InstallDependencies.ts', () => ({
    installDependencies: async () => {},
  }))

  jest.unstable_mockModule('../src/parts/ModifyEsbuildConfig/ModifyEsbuildConfig.ts', () => ({
    modifyEsbuildConfig: async () => {},
  }))

  jest.unstable_mockModule('../src/parts/BuildExtension/BuildExtension.ts', () => ({
    buildExtension: async () => {},
  }))

  jest.unstable_mockModule('../src/parts/CopySourceMaps/CopySourceMaps.ts', () => ({
    copySourceMaps: async () => {},
  }))

  const { generateExtensionSourceMaps } = await import('../src/parts/GenerateExtensionSourceMaps/GenerateExtensionSourceMaps.ts')

  await generateExtensionSourceMaps({
    cacheDir: tempCache,
    extensionName,
    outputDir: tempOutput,
    repoUrl,
    version,
  })

  expect(cloneCalled).toBe(true)

  await rm(tempOutput, { force: true, recursive: true })
  await rm(tempCache, { force: true, recursive: true })
})

test.skip('generateExtensionSourceMaps - finds commit and checks out', async () => {
  const tempOutput = join(tmpdir(), `test-generate-${Date.now()}`)
  const tempCache = join(tmpdir(), `test-cache-${Date.now()}`)
  const extensionName = 'test-extension'
  const version = '1.0.0'
  const repoUrl = 'git@github.com:test/repo.git'
  const expectedCommit = 'abc123'

  const repoPath = join(tempCache, `${extensionName}-${version}`)
  await mkdir(repoPath, { recursive: true })

  let findCommitCalled = false
  let checkoutCalled = false

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[]) => {
      if (method === 'exec.exec' && command === 'git') {
        if (args[0] === 'checkout') {
          checkoutCalled = true
          expect(args[1]).toBe(expectedCommit)
        }
        return {
          exitCode: 0,
          stderr: '',
          stdout: '',
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

  jest.unstable_mockModule('../src/parts/CloneRepository/CloneRepository.ts', () => ({
    cloneRepository: async () => {},
  }))

  jest.unstable_mockModule('../src/parts/FindCommitForVersion/FindCommitForVersion.ts', () => ({
    findCommitForVersion: async (path: string, ver: string) => {
      findCommitCalled = true
      expect(path).toBe(repoPath)
      expect(ver).toBe(version)
      return expectedCommit
    },
  }))

  jest.unstable_mockModule('../src/parts/GetNodeVersion/GetNodeVersion.ts', () => ({
    getNodeVersion: async () => '18.0.0',
  }))

  jest.unstable_mockModule('../src/parts/InstallNodeVersion/InstallNodeVersion.ts', () => ({
    installNodeVersion: async () => 'v18.0.0',
  }))

  jest.unstable_mockModule('../src/parts/InstallDependencies/InstallDependencies.ts', () => ({
    installDependencies: async () => {},
  }))

  jest.unstable_mockModule('../src/parts/ModifyEsbuildConfig/ModifyEsbuildConfig.ts', () => ({
    modifyEsbuildConfig: async () => {},
  }))

  jest.unstable_mockModule('../src/parts/BuildExtension/BuildExtension.ts', () => ({
    buildExtension: async () => {},
  }))

  jest.unstable_mockModule('../src/parts/CopySourceMaps/CopySourceMaps.ts', () => ({
    copySourceMaps: async () => {},
  }))

  const { generateExtensionSourceMaps } = await import('../src/parts/GenerateExtensionSourceMaps/GenerateExtensionSourceMaps.ts')

  await generateExtensionSourceMaps({
    cacheDir: tempCache,
    extensionName,
    outputDir: tempOutput,
    repoUrl,
    version,
  })

  expect(findCommitCalled).toBe(true)
  expect(checkoutCalled).toBe(true)

  await rm(tempOutput, { force: true, recursive: true })
  await rm(tempCache, { force: true, recursive: true })
})

test.skip('generateExtensionSourceMaps - throws error when checkout fails', async () => {
  const tempOutput = join(tmpdir(), `test-generate-${Date.now()}`)
  const tempCache = join(tmpdir(), `test-cache-${Date.now()}`)
  const extensionName = 'test-extension'
  const version = '1.0.0'
  const repoUrl = 'git@github.com:test/repo.git'

  const repoPath = join(tempCache, `${extensionName}-${version}`)
  await mkdir(repoPath, { recursive: true })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[]) => {
      if (method === 'exec.exec' && command === 'git' && args[0] === 'checkout') {
        return {
          exitCode: 1,
          stderr: 'checkout failed',
          stdout: '',
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

  jest.unstable_mockModule('../src/parts/CloneRepository/CloneRepository.ts', () => ({
    cloneRepository: async () => {},
  }))

  jest.unstable_mockModule('../src/parts/FindCommitForVersion/FindCommitForVersion.ts', () => ({
    findCommitForVersion: async () => 'abc123',
  }))

  const { generateExtensionSourceMaps } = await import('../src/parts/GenerateExtensionSourceMaps/GenerateExtensionSourceMaps.ts')

  await expect(
    generateExtensionSourceMaps({
      cacheDir: tempCache,
      extensionName,
      outputDir: tempOutput,
      repoUrl,
      version,
    }),
  ).rejects.toThrow('Failed to checkout commit abc123: checkout failed')

  await rm(tempOutput, { force: true, recursive: true })
  await rm(tempCache, { force: true, recursive: true })
})

test.skip('generateExtensionSourceMaps - executes full workflow', async () => {
  const tempOutput = join(tmpdir(), `test-generate-${Date.now()}`)
  const tempCache = join(tmpdir(), `test-cache-${Date.now()}`)
  const extensionName = 'test-extension'
  const version = '1.0.0'
  const repoUrl = 'git@github.com:test/repo.git'

  const repoPath = join(tempCache, `${extensionName}-${version}`)
  await mkdir(repoPath, { recursive: true })

  const packageJson = {
    engines: {
      node: '>=18.0.0',
    },
  }
  await writeFile(join(repoPath, 'package.json'), JSON.stringify(packageJson))

  const workflowCalls: string[] = []

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[]) => {
      if (method === 'exec.exec' && command === 'git') {
        return {
          exitCode: 0,
          stderr: '',
          stdout: '',
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

  jest.unstable_mockModule('../src/parts/CloneRepository/CloneRepository.ts', () => ({
    cloneRepository: async () => {
      workflowCalls.push('clone')
    },
  }))

  jest.unstable_mockModule('../src/parts/FindCommitForVersion/FindCommitForVersion.ts', () => ({
    findCommitForVersion: async () => {
      workflowCalls.push('findCommit')
      return 'abc123'
    },
  }))

  jest.unstable_mockModule('../src/parts/GetNodeVersion/GetNodeVersion.ts', () => ({
    getNodeVersion: async () => {
      workflowCalls.push('getNodeVersion')
      return '18.0.0'
    },
  }))

  jest.unstable_mockModule('../src/parts/InstallNodeVersion/InstallNodeVersion.ts', () => ({
    installNodeVersion: async () => {
      workflowCalls.push('installNodeVersion')
      return 'v18.0.0'
    },
  }))

  jest.unstable_mockModule('../src/parts/InstallDependencies/InstallDependencies.ts', () => ({
    installDependencies: async () => {
      workflowCalls.push('installDependencies')
    },
  }))

  jest.unstable_mockModule('../src/parts/ModifyEsbuildConfig/ModifyEsbuildConfig.ts', () => ({
    modifyEsbuildConfig: async () => {
      workflowCalls.push('modifyEsbuildConfig')
    },
  }))

  jest.unstable_mockModule('../src/parts/BuildExtension/BuildExtension.ts', () => ({
    buildExtension: async () => {
      workflowCalls.push('buildExtension')
    },
  }))

  jest.unstable_mockModule('../src/parts/CopySourceMaps/CopySourceMaps.ts', () => ({
    copySourceMaps: async () => {
      workflowCalls.push('copySourceMaps')
    },
  }))

  const { generateExtensionSourceMaps } = await import('../src/parts/GenerateExtensionSourceMaps/GenerateExtensionSourceMaps.ts')

  await generateExtensionSourceMaps({
    cacheDir: tempCache,
    extensionName,
    outputDir: tempOutput,
    repoUrl,
    version,
  })

  expect(workflowCalls).toEqual([
    'findCommit',
    'getNodeVersion',
    'installNodeVersion',
    'installDependencies',
    'modifyEsbuildConfig',
    'buildExtension',
    'copySourceMaps',
  ])

  await rm(tempOutput, { force: true, recursive: true })
  await rm(tempCache, { force: true, recursive: true })
})

test.skip('generateExtensionSourceMaps - logs messages correctly', async () => {
  const tempOutput = join(tmpdir(), `test-generate-${Date.now()}`)
  const tempCache = join(tmpdir(), `test-cache-${Date.now()}`)
  const extensionName = 'test-extension'
  const version = '1.0.0'
  const repoUrl = 'git@github.com:test/repo.git'
  const expectedCommit = 'abc123'
  const nodeVersion = '18.0.0'
  const installedVersion = 'v18.0.0'

  const repoPath = join(tempCache, `${extensionName}-${version}`)
  await mkdir(repoPath, { recursive: true })

  const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, command: string, args: string[]) => {
      if (method === 'exec.exec' && command === 'git') {
        return {
          exitCode: 0,
          stderr: '',
          stdout: '',
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

  jest.unstable_mockModule('../src/parts/CloneRepository/CloneRepository.ts', () => ({
    cloneRepository: async () => {},
  }))

  jest.unstable_mockModule('../src/parts/FindCommitForVersion/FindCommitForVersion.ts', () => ({
    findCommitForVersion: async () => expectedCommit,
  }))

  jest.unstable_mockModule('../src/parts/GetNodeVersion/GetNodeVersion.ts', () => ({
    getNodeVersion: async () => nodeVersion,
  }))

  jest.unstable_mockModule('../src/parts/InstallNodeVersion/InstallNodeVersion.ts', () => ({
    installNodeVersion: async () => installedVersion,
  }))

  jest.unstable_mockModule('../src/parts/InstallDependencies/InstallDependencies.ts', () => ({
    installDependencies: async () => {},
  }))

  jest.unstable_mockModule('../src/parts/ModifyEsbuildConfig/ModifyEsbuildConfig.ts', () => ({
    modifyEsbuildConfig: async () => {},
  }))

  jest.unstable_mockModule('../src/parts/BuildExtension/BuildExtension.ts', () => ({
    buildExtension: async () => {},
  }))

  jest.unstable_mockModule('../src/parts/CopySourceMaps/CopySourceMaps.ts', () => ({
    copySourceMaps: async () => {},
  }))

  const { generateExtensionSourceMaps } = await import('../src/parts/GenerateExtensionSourceMaps/GenerateExtensionSourceMaps.ts')

  await generateExtensionSourceMaps({
    cacheDir: tempCache,
    extensionName,
    outputDir: tempOutput,
    repoUrl,
    version,
  })

  expect(consoleSpy).toHaveBeenCalledWith(`[extension-source-maps] Finding commit for version ${version}...`)
  expect(consoleSpy).toHaveBeenCalledWith(`[extension-source-maps] Found commit: ${expectedCommit}`)
  expect(consoleSpy).toHaveBeenCalledWith(`[extension-source-maps] Getting node version from package.json...`)
  expect(consoleSpy).toHaveBeenCalledWith(`[extension-source-maps] Node version: ${nodeVersion}`)
  expect(consoleSpy).toHaveBeenCalledWith(`[extension-source-maps] Installing node version ${nodeVersion}...`)
  expect(consoleSpy).toHaveBeenCalledWith(`[extension-source-maps] Node version ${installedVersion} installed successfully`)
  expect(consoleSpy).toHaveBeenCalledWith(`[extension-source-maps] Installing dependencies...`)
  expect(consoleSpy).toHaveBeenCalledWith(`[extension-source-maps] Dependencies installed successfully`)
  expect(consoleSpy).toHaveBeenCalledWith(`[extension-source-maps] Modifying esbuild config to generate sourcemaps...`)
  expect(consoleSpy).toHaveBeenCalledWith(`[extension-source-maps] Building extension...`)
  expect(consoleSpy).toHaveBeenCalledWith(`[extension-source-maps] Copying source maps...`)
  expect(consoleSpy).toHaveBeenCalledWith(`[extension-source-maps] Successfully generated source maps for ${extensionName} ${version}`)

  consoleSpy.mockRestore()

  await rm(tempOutput, { force: true, recursive: true })
  await rm(tempCache, { force: true, recursive: true })
})
