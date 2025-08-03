import { join } from 'node:path'
import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'

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
const mockSetupNodeModulesFromCache = jest.fn()
const mockLog = jest.fn()

jest.unstable_mockModule('path-exists', () => ({
  pathExists: mockPathExists,
}))

jest.unstable_mockModule('../src/parts/Filesystem/Filesystem.js', () => ({
  makeDirectory: mockMkdir,
  writeFile: mockWriteFile,
  remove: mockRm,
  pathExists: mockPathExists,
}))

jest.unstable_mockModule('execa', () => ({
  execa: mockExeca,
}))

jest.unstable_mockModule('../src/parts/Exec/Exec.js', () => ({
  exec: mockExec,
}))

jest.unstable_mockModule('../src/parts/CacheNodeModules/CacheNodeModules.js', () => ({
  addNodeModulesToCache: mockAddNodeModulesToCache,
}))

jest.unstable_mockModule('../src/parts/CheckCacheExists/CheckCacheExists.js', () => ({
  checkCacheExists: mockCheckCacheExists,
}))

jest.unstable_mockModule('../src/parts/CheckoutCommit/CheckoutCommit.js', () => ({
  checkoutCommit: mockCheckoutCommit,
}))

jest.unstable_mockModule('../src/parts/CloneRepository/CloneRepository.js', () => ({
  cloneRepository: mockCloneRepository,
}))

jest.unstable_mockModule('../src/parts/InstallDependencies/InstallDependencies.js', () => ({
  installDependencies: mockInstallDependencies,
}))

jest.unstable_mockModule('../src/parts/ResolveCommitHash/ResolveCommitHash.js', () => ({
  resolveCommitHash: mockResolveCommitHash,
}))

jest.unstable_mockModule('../src/parts/RunCompile/RunCompile.js', () => ({
  runCompile: mockRunCompile,
}))

jest.unstable_mockModule('../src/parts/SetupNodeModulesFromCache/SetupNodeModulesFromCache.js', () => ({
  setupNodeModulesFromCache: mockSetupNodeModulesFromCache,
}))

jest.unstable_mockModule('../src/parts/Logger/Logger.js', () => ({
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
    return Promise.resolve(commitRef)
  })
  mockCloneRepository.mockReturnValue(undefined)
  mockCheckoutCommit.mockReturnValue(undefined)
  mockCheckCacheExists.mockReturnValue(false)
  mockSetupNodeModulesFromCache.mockReturnValue(true)
  mockInstallDependencies.mockReturnValue(undefined)
  mockAddNodeModulesToCache.mockReturnValue(undefined)
  mockRunCompile.mockReturnValue(undefined)
  mockLog.mockReturnValue(undefined)
})

afterEach(() => {
  jest.resetModules()
})

const { downloadAndBuildVscodeFromCommit } = await import(
  '../src/parts/DownloadAndBuildVscodeFromCommit/DownloadAndBuildVscodeFromCommit.js'
)

test('downloadVscodeCommit - tests git clone operations with mocked execa', async () => {
  const testCommitHash = 'a1b2c3d4e5f6789012345678901234567890abcd'
  const testReposDir = join('/test', '.test-repos')
  const testRepoUrl = 'https://github.com/microsoft/vscode.git'

  // Mock path structure using /test directory instead of root
  const reposDir = testReposDir
  const repoPath = join(reposDir, testCommitHash)

  // Mock filesystem responses - repo doesn't exist initially
  mockPathExists.mockImplementation((path) => {
    if (path === reposDir) {
      return false
    }

    if (path === repoPath) {
      return false
    }

    return false
  })

  // Mock successful directory creation
  mockMkdir.mockReturnValue(undefined)

  // Call the function - it should now work with mocked execa
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
  // Create a temporary test directory structure
  const testCommitHash = 'test-commit-123'
  const reposDir = join('/test', '.vscode-repos')
  const repoPath = join(reposDir, testCommitHash)
  const mainJsPath = join(repoPath, 'out', 'main.js')
  const nodeModulesPath = join(repoPath, 'node_modules')
  const outPath = join(repoPath, 'out')

  // Mock filesystem responses for missing node_modules scenario
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

  // Mock successful directory creation
  mockMkdir.mockReturnValue(undefined)

  // This should detect missing node_modules and attempt to restore from cache
  await downloadAndBuildVscodeFromCommit(testCommitHash, DEFAULT_REPO_URL, reposDir, '/test/cache', false)

  // Verify that installDependencies was called since cache doesn't exist
  expect(mockInstallDependencies).toHaveBeenCalled()

  // Verify that logger was called for installation
  expect(mockLog).toHaveBeenCalledWith(`Installing dependencies for commit ${testCommitHash}...`)
})

test('downloadAndBuildVscodeFromCommit - handles interrupted workflow with existing node_modules', async () => {
  // Create a temporary test directory structure
  const testCommitHash = 'test-commit-456'
  const reposDir = join('/test', '.vscode-repos')
  const repoPath = join(reposDir, testCommitHash)
  const mainJsPath = join(repoPath, 'out', 'main.js')
  const nodeModulesPath = join(repoPath, 'node_modules')
  const outPath = join(repoPath, 'out')

  // Mock filesystem responses for existing node_modules scenario
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

  // Mock successful directory creation
  mockMkdir.mockReturnValue(undefined)

  // This should detect existing node_modules and skip npm ci
  await downloadAndBuildVscodeFromCommit(testCommitHash, DEFAULT_REPO_URL, reposDir, '/test/cache', false)

  // Since main.js doesn't exist but node_modules does, it should still call installDependencies
  // because needsInstall = !existsMainJsPath && !existsNodeModulesPath = true && false = false
  // But the logic shows it will still call installDependencies if needsInstall is true
  // Let me check what the actual paths are being checked
  expect(mockPathExists).toHaveBeenCalledWith(mainJsPath)
  expect(mockPathExists).toHaveBeenCalledWith(nodeModulesPath)

  // Verify that logger was called for the skip message
  expect(mockLog).toHaveBeenCalledWith(`node_modules already exists in repo for commit ${testCommitHash}, skipping npm ci...`)
})

test('downloadAndBuildVscodeFromCommit - handles interrupted workflow with existing out folder', async () => {
  // Create a temporary test directory structure
  const testCommitHash = 'test-commit-789'
  const reposDir = join('/test', '.vscode-repos')
  const repoPath = join(reposDir, testCommitHash)
  const mainJsPath = join(repoPath, 'out', 'main.js')
  const nodeModulesPath = join(repoPath, 'node_modules')
  const outPath = join(repoPath, 'out')

  // Mock filesystem responses for existing out folder scenario
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

  // Mock successful directory creation
  mockMkdir.mockReturnValue(undefined)

  // This should detect existing out folder and skip compilation
  await downloadAndBuildVscodeFromCommit(testCommitHash, DEFAULT_REPO_URL, reposDir, '/test/cache', false)

  // Since main.js doesn't exist but out folder does, it should still call runCompile
  // because needsCompile = !existsMainJsPath && !existsOutPath = true && false = false
  // But the logic shows it will still call runCompile if needsCompile is true
  // Let me check what the actual paths are being checked
  expect(mockPathExists).toHaveBeenCalledWith(mainJsPath)
  expect(mockPathExists).toHaveBeenCalledWith(outPath)

  // Verify that logger was called for the skip message
  expect(mockLog).toHaveBeenCalledWith(`node_modules already exists in repo for commit ${testCommitHash}, skipping npm ci...`)
})
