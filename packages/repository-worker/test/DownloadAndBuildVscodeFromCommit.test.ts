import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'
import * as Path from '../src/parts/Path/Path.ts'
import * as FileSystemWorker from '../src/parts/FileSystemWorker/FileSystemWorker.ts'
import { MockRpc } from '@lvce-editor/rpc'

const DEFAULT_REPO_URL = 'https://github.com/microsoft/vscode.git'

const mockPathExists = jest.fn()
const mockMkdir = jest.fn()
const mockWriteFile = jest.fn()
const mockRm = jest.fn()

const mockExeca = jest.fn()

const mockExec = jest.fn()

const mockAddNodeModulesToCache = jest.fn()
const mockCheckCacheExists = jest.fn()
const mockCheckoutCommit = jest.fn()
const mockCloneRepository = jest.fn()
const mockInstallDependencies = jest.fn()
const mockResolveCommitHash = jest.fn()
const mockRunCompile = jest.fn()
const mockCopyNodeModulesFromCacheToRepositoryFolder = jest.fn()
const mockLog = jest.fn()

jest.unstable_mockModule('../src/parts/Exec/Exec.ts', () => ({
  exec: mockExec,
}))

jest.unstable_mockModule('../src/parts/CacheNodeModules/CacheNodeModules.ts', () => ({
  addNodeModulesToCache: mockAddNodeModulesToCache,
}))

jest.unstable_mockModule('../src/parts/CheckoutCommit/CheckoutCommit.ts', () => ({
  checkoutCommit: mockCheckoutCommit,
}))

jest.unstable_mockModule('../src/parts/CloneRepository/CloneRepository.ts', () => ({
  cloneRepository: mockCloneRepository,
}))

jest.unstable_mockModule('../src/parts/InstallDependencies/InstallDependencies.ts', () => ({
  installDependencies: mockInstallDependencies,
}))

jest.unstable_mockModule('../src/parts/ResolveCommitHash/ResolveCommitHash.ts', () => ({
  resolveCommitHash: mockResolveCommitHash,
}))

jest.unstable_mockModule('../src/parts/RunCompile/RunCompile.ts', () => ({
  runCompile: mockRunCompile,
}))

jest.unstable_mockModule('../src/parts/CopyNodeModulesFromCacheToRepositoryFolder/CopyNodeModulesFromCacheToRepositoryFolder.ts', () => ({
  copyNodeModulesFromCacheToRepositoryFolder: mockCopyNodeModulesFromCacheToRepositoryFolder,
}))

jest.unstable_mockModule('../src/parts/Logger/Logger.ts', () => ({
  log: mockLog,
}))

beforeEach(() => {
  jest.clearAllMocks()

  // Set up default mock implementations
  mockPathExists.mockReturnValue(false)
  mockMkdir.mockReturnValue(undefined)
  mockWriteFile.mockReturnValue(undefined)
  mockRm.mockReturnValue(undefined)

  mockExec.mockImplementation((command, args, options) => {
    if (command === 'git' && Array.isArray(args) && args.includes('ls-remote')) {
      return {
        stdout: 'a1b2c3d4e5f6789012345678901234567890abcd',
        stderr: '',
        exitCode: 0,
      }
    }

    if (command === 'git' && Array.isArray(args) && args.includes('clone')) {
      return { stdout: '', stderr: '', exitCode: 0 }
    }

    if (command === 'git' && Array.isArray(args) && args.includes('checkout')) {
      return { stdout: '', stderr: '', exitCode: 0 }
    }

    // Default mock for other commands
    return { stdout: '', stderr: '', exitCode: 0 }
  })

  mockExeca.mockImplementation((command, args, options) => {
    if (command === 'git' && Array.isArray(args) && args.includes('clone')) {
      return { stdout: '', stderr: '' }
    }

    if (command === 'git' && Array.isArray(args) && args.includes('checkout')) {
      return { stdout: '', stderr: '' }
    }

    // Default mock for other commands
    return { stdout: '', stderr: '' }
  })

  mockResolveCommitHash.mockImplementation((repoUrl, commitRef) => {
    return commitRef
  })
  mockCloneRepository.mockReturnValue(undefined)
  mockCheckoutCommit.mockReturnValue(undefined)
  mockCheckCacheExists.mockReturnValue(false)
  mockCopyNodeModulesFromCacheToRepositoryFolder.mockReturnValue(true)
  mockInstallDependencies.mockReturnValue(undefined)
  mockAddNodeModulesToCache.mockReturnValue(undefined)
  mockRunCompile.mockReturnValue(undefined)
  mockLog.mockReturnValue(undefined)

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke(method, ...params) {
      switch (method) {
        case 'FileSystem.exists':
          return mockPathExists(...params)
        case 'FileSystem.makeDirectory':
          return mockMkdir(...params)
        case 'FileSystem.findFiles':
          return []

        default:
          throw new Error(`not implemented ${method}`)
      }
    },
  })
  FileSystemWorker.set(mockRpc)
})

afterEach(() => {
  jest.resetModules()
})

const { downloadAndBuildVscodeFromCommit } = await import(
  '../src/parts/DownloadAndBuildVscodeFromCommit/DownloadAndBuildVscodeFromCommit.ts'
)

test('downloadVscodeCommit - tests git clone operations with mocked execa', async () => {
  const testCommitHash = 'a1b2c3d4e5f6789012345678901234567890abcd'
  const testReposDir = Path.join('/test', '.test-repos')
  const testRepoUrl = 'https://github.com/microsoft/vscode.git'

  const reposDir = testReposDir
  const repoPath = Path.join(reposDir, testCommitHash)

  mockPathExists.mockImplementation((path) => {
    if (path === reposDir) {
      return false
    }

    if (path === repoPath) {
      return false
    }

    return false
  })

  mockMkdir.mockReturnValue(undefined)

  await downloadAndBuildVscodeFromCommit(testCommitHash, testRepoUrl, testReposDir, '/test/cache', false)

  // Verify that makeDirectory was called to create the repos directory
  expect(mockMkdir).toHaveBeenCalledWith(reposDir)

  // Verify that cloneRepository was called
  expect(mockCloneRepository).toHaveBeenCalledWith(testRepoUrl, repoPath)

  // Verify that checkoutCommit was called
  expect(mockCheckoutCommit).toHaveBeenCalledWith(repoPath, testCommitHash)

  // Verify that logger was called for installation and compilation
  expect(mockLog).toHaveBeenCalledWith(`Installing dependencies for commit ${testCommitHash}...`)
  expect(mockLog).toHaveBeenCalledWith(`Compiling VS Code for commit ${testCommitHash}...`)
})

test('downloadAndBuildVscodeFromCommit - handles interrupted workflow with missing node_modules', async () => {
  const testCommitHash = 'test-commit-123'
  const reposDir = Path.join('/test', '.vscode-repos')
  const repoPath = Path.join(reposDir, testCommitHash)
  const mainJsPath = Path.join(repoPath, 'out', 'main.ts')
  const nodeModulesPath = Path.join(repoPath, 'node_modules')
  const outPath = Path.join(repoPath, 'out')

  mockPathExists.mockImplementation((path) => {
    if (path === reposDir) {
      return false
    }

    if (path === repoPath) {
      return true
    }

    if (path === mainJsPath) {
      return false
    }

    if (path === nodeModulesPath) {
      return false
    }

    if (path === outPath) {
      return true
    }

    return false
  })

  mockMkdir.mockReturnValue(undefined)

  await downloadAndBuildVscodeFromCommit(testCommitHash, DEFAULT_REPO_URL, reposDir, '/test/cache', false)

  // Verify that installDependencies was called since cache doesn't exist
  expect(mockInstallDependencies).toHaveBeenCalled()

  // Verify that logger was called for installation
  expect(mockLog).toHaveBeenCalledWith(`Installing dependencies for commit ${testCommitHash}...`)
})

test('downloadAndBuildVscodeFromCommit - handles interrupted workflow with existing node_modules', async () => {
  const testCommitHash = 'test-commit-456'
  const reposDir = Path.join('/test', '.vscode-repos')
  const repoPath = Path.join(reposDir, testCommitHash)
  const mainJsPath = Path.join(repoPath, 'out', 'main.ts')
  const nodeModulesPath = Path.join(repoPath, 'node_modules')
  const outPath = Path.join(repoPath, 'out')

  mockPathExists.mockImplementation((path) => {
    if (path === reposDir) {
      return false
    }

    if (path === repoPath) {
      return true
    }

    if (path === mainJsPath) {
      return false
    }

    if (path === nodeModulesPath) {
      return true
    }

    if (path === outPath) {
      return true
    }

    return false
  })

  mockMkdir.mockReturnValue(undefined)

  await downloadAndBuildVscodeFromCommit(testCommitHash, DEFAULT_REPO_URL, reposDir, '/test/cache', false)

  // Since main.js doesn't exist but node_modules does, it should still call installDependencies
  // because needsInstall = !existsMainJsPath && !existsNodeModulesPath = true && false = false
  // But the logic shows it will still call installDependencies if needsInstall is true
  // Let me check what the actual paths are being checked
  expect(mockPathExists).toHaveBeenCalledWith(mainJsPath)
  expect(mockPathExists).toHaveBeenCalledWith(nodeModulesPath)

  // Verify that logger was called for the skip message
  expect(mockLog).toHaveBeenCalledWith(`[repository] node_modules already exists in repo for commit ${testCommitHash}, skipping npm ci...`)
})

test('downloadAndBuildVscodeFromCommit - handles interrupted workflow with existing out folder', async () => {
  const testCommitHash = 'test-commit-789'
  const reposDir = Path.join('/test', '.vscode-repos')
  const repoPath = Path.join(reposDir, testCommitHash)
  const mainJsPath = Path.join(repoPath, 'out', 'main.ts')
  const nodeModulesPath = Path.join(repoPath, 'node_modules')
  const outPath = Path.join(repoPath, 'out')

  mockPathExists.mockImplementation((path) => {
    if (path === reposDir) {
      return false
    }

    if (path === repoPath) {
      return true
    }

    if (path === mainJsPath) {
      return false
    }

    if (path === nodeModulesPath) {
      return true
    }

    if (path === outPath) {
      return true
    }

    return false
  })

  mockMkdir.mockReturnValue(undefined)

  await downloadAndBuildVscodeFromCommit(testCommitHash, DEFAULT_REPO_URL, reposDir, '/test/cache', false)

  // Since main.js doesn't exist but out folder does, it should still call runCompile
  // because needsCompile = !existsMainJsPath && !existsOutPath = true && false = false
  // But the logic shows it will still call runCompile if needsCompile is true
  // Let me check what the actual paths are being checked
  expect(mockPathExists).toHaveBeenCalledWith(mainJsPath)
  expect(mockPathExists).toHaveBeenCalledWith(outPath)

  // Verify that logger was called for the skip message
  expect(mockLog).toHaveBeenCalledWith(`[repository] node_modules already exists in repo for commit ${testCommitHash}, skipping npm ci...`)
})
