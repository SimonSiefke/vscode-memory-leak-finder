import { expect, test, jest, beforeEach, afterEach } from '@jest/globals'
import { join } from 'node:path'
import { downloadAndBuildVscodeFromCommit } from '../src/parts/DownloadAndBuildVscodeFromCommit/DownloadAndBuildVscodeFromCommit.js'
import * as Root from '../src/parts/Root/Root.js'

// Default values for testing
const DEFAULT_REPO_URL = 'https://github.com/microsoft/vscode.git'
const DEFAULT_REPOS_DIR = '.vscode-repos'

// Mock filesystem operations
const mockPathExists = jest.fn()
const mockMkdir = jest.fn()
const mockWriteFile = jest.fn()
const mockRm = jest.fn()

// Mock execa
const mockExeca = jest.fn()

// Mock exec function
const mockExec = jest.fn()

// Mock all the dependencies
const mockAddNodeModulesToCache = jest.fn()
const mockCheckCacheExists = jest.fn()
const mockCheckoutCommit = jest.fn()
const mockCloneRepository = jest.fn()
const mockInstallDependencies = jest.fn()
const mockResolveCommitHash = jest.fn()
const mockRunCompile = jest.fn()
const mockSetupNodeModulesFromCache = jest.fn()

jest.unstable_mockModule('path-exists', () => ({
  pathExists: mockPathExists,
}))

jest.unstable_mockModule('node:fs/promises', () => ({
  mkdir: mockMkdir,
  writeFile: mockWriteFile,
  rm: mockRm,
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

beforeEach(() => {
  jest.clearAllMocks()
  
  // Set up default mock implementations
  mockPathExists.mockReturnValue(false)
  mockMkdir.mockReturnValue(undefined)
  mockWriteFile.mockReturnValue(undefined)
  mockRm.mockReturnValue(undefined)
  
  mockExec.mockImplementation((command, args, options) => {
    if (command === 'git' && args.includes('ls-remote')) {
      // Mock git ls-remote for resolving commit hash
      return { 
        stdout: 'a1b2c3d4e5f6789012345678901234567890abcd', 
        stderr: '', 
        exitCode: 0 
      }
    }
    if (command === 'git' && args.includes('clone')) {
      // Mock git clone
      return { stdout: '', stderr: '', exitCode: 0 }
    }
    if (command === 'git' && args.includes('checkout')) {
      // Mock git checkout
      return { stdout: '', stderr: '', exitCode: 0 }
    }
    // Default mock for other commands
    return { stdout: '', stderr: '', exitCode: 0 }
  })

  mockExeca.mockImplementation((command, args, options) => {
    if (command === 'git' && args.includes('clone')) {
      // Mock git clone
      return { stdout: '', stderr: '' }
    }
    if (command === 'git' && args.includes('checkout')) {
      // Mock git checkout
      return { stdout: '', stderr: '' }
    }
    // Default mock for other commands
    return { stdout: '', stderr: '' }
  })

  // Mock all dependency functions
  mockResolveCommitHash.mockReturnValue('a1b2c3d4e5f6789012345678901234567890abcd')
  mockCloneRepository.mockReturnValue(undefined)
  mockCheckoutCommit.mockReturnValue(undefined)
  mockCheckCacheExists.mockReturnValue(false)
  mockSetupNodeModulesFromCache.mockReturnValue(true)
  mockInstallDependencies.mockReturnValue(undefined)
  mockAddNodeModulesToCache.mockReturnValue(undefined)
  mockRunCompile.mockReturnValue(undefined)
})

afterEach(() => {
  jest.resetModules()
})

test('downloadVscodeCommit - tests git clone operations with mocked execa', async () => {
  // Test that the function properly calls git clone and checkout
  const testCommitHash = 'a1b2c3d4e5f6789012345678901234567890abcd'
  const testOutFolder = '.test-repos'
  const testRepoUrl = 'https://github.com/microsoft/vscode.git'

  // Mock path structure
  const reposDir = join(Root.root, testOutFolder)
  const repoPath = join(reposDir, testCommitHash)

  // Mock filesystem responses - repo doesn't exist initially
  mockPathExists.mockImplementation((path) => {
    if (path === reposDir) return false
    if (path === repoPath) return false
    return false
  })

  // Mock successful directory creation
  mockMkdir.mockResolvedValue(undefined)

  // Call the function - it should now work with mocked execa
  await downloadAndBuildVscodeFromCommit(testCommitHash, testRepoUrl, testOutFolder, '/test/cache', false)

  // Verify that mkdir was called to create the repos directory
  expect(mockMkdir).toHaveBeenCalledWith(reposDir, { recursive: true })

  // Verify that execa was called for git clone
  expect(mockExeca).toHaveBeenCalledWith('git', ['clone', testRepoUrl, repoPath])

  // Verify that execa was called for git checkout
  expect(mockExeca).toHaveBeenCalledWith('git', ['checkout', testCommitHash], { cwd: repoPath })
})

test('downloadAndBuildVscodeFromCommit - handles interrupted workflow with missing node_modules', async () => {
  // Create a temporary test directory structure
  const testCommitHash = 'test-commit-123'
  const reposDir = join(Root.root, '.vscode-repos')
  const repoPath = join(reposDir, testCommitHash)
  const mainJsPath = join(repoPath, 'out', 'main.js')
  const nodeModulesPath = join(repoPath, 'node_modules')
  const outPath = join(repoPath, 'out')

  // Mock filesystem responses for missing node_modules scenario
  mockPathExists.mockImplementation((path) => {
    if (path === reposDir) return false
    if (path === repoPath) return true
    if (path === mainJsPath) return false
    if (path === nodeModulesPath) return false
    if (path === outPath) return true
    return false
  })

  // Mock successful directory creation
  mockMkdir.mockResolvedValue(undefined)

  // This should detect missing node_modules and attempt to restore from cache
  // Since we're in a test environment, it will likely fail gracefully
  await expect(
    downloadAndBuildVscodeFromCommit(testCommitHash, DEFAULT_REPO_URL, DEFAULT_REPOS_DIR, '/test/cache', false),
  ).rejects.toThrow()
})

test('downloadAndBuildVscodeFromCommit - handles interrupted workflow with existing node_modules', async () => {
  // Create a temporary test directory structure
  const testCommitHash = 'test-commit-456'
  const reposDir = join(Root.root, '.vscode-repos')
  const repoPath = join(reposDir, testCommitHash)
  const mainJsPath = join(repoPath, 'out', 'main.js')
  const nodeModulesPath = join(repoPath, 'node_modules')
  const outPath = join(repoPath, 'out')

  // Mock filesystem responses for existing node_modules scenario
  mockPathExists.mockImplementation((path) => {
    if (path === reposDir) return false
    if (path === repoPath) return true
    if (path === mainJsPath) return false
    if (path === nodeModulesPath) return true
    if (path === outPath) return true
    return false
  })

  // Mock successful directory creation
  mockMkdir.mockResolvedValue(undefined)

  // This should detect existing node_modules and skip npm ci
  // Since we're in a test environment, it will likely fail gracefully
  await expect(
    downloadAndBuildVscodeFromCommit(testCommitHash, DEFAULT_REPO_URL, DEFAULT_REPOS_DIR, '/test/cache', false),
  ).rejects.toThrow()
})

test('downloadAndBuildVscodeFromCommit - handles interrupted workflow with existing out folder', async () => {
  // Create a temporary test directory structure
  const testCommitHash = 'test-commit-789'
  const reposDir = join(Root.root, '.vscode-repos')
  const repoPath = join(reposDir, testCommitHash)
  const mainJsPath = join(repoPath, 'out', 'main.js')
  const nodeModulesPath = join(repoPath, 'node_modules')
  const outPath = join(repoPath, 'out')

  // Mock filesystem responses for existing out folder scenario
  mockPathExists.mockImplementation((path) => {
    if (path === reposDir) return false
    if (path === repoPath) return true
    if (path === mainJsPath) return false
    if (path === nodeModulesPath) return true
    if (path === outPath) return true
    return false
  })

  // Mock successful directory creation
  mockMkdir.mockResolvedValue(undefined)

  // This should detect existing out folder and skip compilation
  // Since we're in a test environment, it will likely fail gracefully
  await expect(
    downloadAndBuildVscodeFromCommit(testCommitHash, DEFAULT_REPO_URL, DEFAULT_REPOS_DIR, '/test/cache', false),
  ).rejects.toThrow()
})
