import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import * as FileSystemWorker from '../src/parts/FileSystemWorker/FileSystemWorker.ts'
import * as Path from '../src/parts/Path/Path.ts'

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
const mockEnsureNestedDependencies = jest.fn<(cwd: string, useNice: boolean) => Promise<number>>()
const mockResolveCommitHash = jest.fn()
const mockRunCompile = jest.fn()
const mockCopyNodeModulesFromCacheToRepositoryFolder = jest.fn()
const mockHasCompleteTopLevelNodeModules = jest.fn<(repoPath: string) => Promise<boolean>>()
const mockPreCacheRipgrep = jest.fn<(platform: string, arch: string) => Promise<void>>()
const mockLog = jest.fn()

jest.unstable_mockModule('../src/parts/Exec/Exec.ts', () => ({
  exec: mockExec,
}))

jest.unstable_mockModule('../src/parts/CacheNodeModules/CacheNodeModules.ts', () => ({
  addNodeModulesToCache: mockAddNodeModulesToCache,
  moveNodeModulesToCache: mockAddNodeModulesToCache,
}))

jest.unstable_mockModule('../src/parts/CheckoutCommit/CheckoutCommit.ts', () => ({
  checkoutCommit: mockCheckoutCommit,
}))

jest.unstable_mockModule('../src/parts/CloneRepository/CloneRepository.ts', () => ({
  cloneRepository: mockCloneRepository,
}))

jest.unstable_mockModule('../src/parts/InstallDependencies/InstallDependencies.ts', () => ({
  installDependencies: mockInstallDependencies,
  ensureNestedDependencies: mockEnsureNestedDependencies,
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

jest.unstable_mockModule('../src/parts/HasCompleteTopLevelNodeModules/HasCompleteTopLevelNodeModules.ts', () => ({
  hasCompleteTopLevelNodeModules: mockHasCompleteTopLevelNodeModules,
}))

jest.unstable_mockModule('../src/parts/PreCacheRipgrep/PreCacheRipgrep.ts', () => ({
  preCacheRipgrep: mockPreCacheRipgrep,
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
        exitCode: 0,
        stderr: '',
        stdout: 'a1b2c3d4e5f6789012345678901234567890abcd',
      }
    }

    if (command === 'git' && Array.isArray(args) && args.includes('clone')) {
      return { exitCode: 0, stderr: '', stdout: '' }
    }

    if (command === 'git' && Array.isArray(args) && args.includes('checkout')) {
      return { exitCode: 0, stderr: '', stdout: '' }
    }

    // Default mock for other commands
    return { exitCode: 0, stderr: '', stdout: '' }
  })

  mockExeca.mockImplementation((command, args, options) => {
    if (command === 'git' && Array.isArray(args) && args.includes('clone')) {
      return { stderr: '', stdout: '' }
    }

    if (command === 'git' && Array.isArray(args) && args.includes('checkout')) {
      return { stderr: '', stdout: '' }
    }

    // Default mock for other commands
    return { stderr: '', stdout: '' }
  })

  mockResolveCommitHash.mockImplementation((repoUrl, commitRef) => {
    return commitRef
  })
  mockHasCompleteTopLevelNodeModules.mockResolvedValue(true)
  mockPreCacheRipgrep.mockResolvedValue(undefined)
  mockCloneRepository.mockReturnValue(undefined)
  mockCheckoutCommit.mockReturnValue(undefined)
  mockCheckCacheExists.mockReturnValue(false)
  mockCopyNodeModulesFromCacheToRepositoryFolder.mockReturnValue(true)
  mockInstallDependencies.mockReturnValue(undefined)
  mockEnsureNestedDependencies.mockResolvedValue(0)
  mockAddNodeModulesToCache.mockReturnValue(undefined)
  mockRunCompile.mockReturnValue(undefined)
  mockLog.mockReturnValue(undefined)

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke(method: string, ...params: unknown[]) {
      switch (method) {
        case 'FileSystem.exists':
          return mockPathExists(...params)
        case 'FileSystem.findFiles':
          return []
        case 'FileSystem.readFileContent':
          return '20.0.0'
        case 'FileSystem.makeDirectory':
          return mockMkdir(...params)

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

const { downloadAndBuildVscodeFromCommit } =
  await import('../src/parts/DownloadAndBuildVscodeFromCommit/DownloadAndBuildVscodeFromCommit.ts')

test('downloadAndBuildVscodeFromCommit - clones when cached node_modules exist without git metadata', async () => {
  const testCommitHash = '0123456789abcdef0123456789abcdef01234567'
  const reposDir = Path.join('/test', '.vscode-repos')
  const repoPath = Path.join(reposDir, testCommitHash)
  const gitPath = Path.join(repoPath, '.git')
  const mainJsPath = Path.join(repoPath, 'out', 'main.js')
  const nodeModulesPath = Path.join(repoPath, 'node_modules')
  const nodeModulesPackageLock = Path.join(nodeModulesPath, '.package-lock.json')
  const outPath = Path.join(repoPath, 'out')

  mockResolveCommitHash.mockImplementation(async () => ({
    commitHash: testCommitHash,
    owner: 'microsoft',
  }))

  mockPathExists.mockImplementation((path) => {
    if (path === reposDir) {
      return true
    }
    if (path === gitPath) {
      return false
    }
    if (path === mainJsPath) {
      return false
    }
    if (path === nodeModulesPath) {
      return true
    }
    if (path === nodeModulesPackageLock) {
      return true
    }
    if (path === outPath) {
      return false
    }
    return false
  })

  await downloadAndBuildVscodeFromCommit('linux', 'x64', testCommitHash, DEFAULT_REPO_URL, reposDir, '', false)

  expect(mockCloneRepository.mock.calls).toEqual([[DEFAULT_REPO_URL, repoPath, testCommitHash]])
  expect(mockInstallDependencies).not.toHaveBeenCalled()
})

test('downloadAndBuildVscodeFromCommit reinstalls dependencies when restored node_modules cache is incomplete', async () => {
  const testCommitHash = 'fedcba9876543210fedcba9876543210fedcba98'
  const reposDir = Path.join('/test', '.vscode-repos')
  const repoPath = Path.join(reposDir, testCommitHash)
  const gitPath = Path.join(repoPath, '.git')
  const mainJsPath = Path.join(repoPath, 'out', 'main.js')
  const nodeModulesPath = Path.join(repoPath, 'node_modules')
  const nodeModulesPackageLock = Path.join(nodeModulesPath, '.package-lock.json')
  const outPath = Path.join(repoPath, 'out')

  mockResolveCommitHash.mockImplementation(async () => ({
    commitHash: testCommitHash,
    owner: 'microsoft',
  }))
  mockHasCompleteTopLevelNodeModules.mockResolvedValue(false)

  mockPathExists.mockImplementation((path) => {
    if (path === reposDir) {
      return true
    }
    if (path === gitPath) {
      return true
    }
    if (path === mainJsPath) {
      return false
    }
    if (path === nodeModulesPath) {
      return true
    }
    if (path === nodeModulesPackageLock) {
      return true
    }
    if (path === outPath) {
      return false
    }
    return false
  })

  await downloadAndBuildVscodeFromCommit('linux', 'x64', testCommitHash, DEFAULT_REPO_URL, reposDir, '', false)

  expect(mockHasCompleteTopLevelNodeModules).toHaveBeenCalledWith(repoPath)
  expect(mockInstallDependencies).toHaveBeenCalledWith(repoPath, false)
  expect(mockLog).toHaveBeenCalledWith(`[repository] node_modules cache for commit ${testCommitHash} is incomplete, running npm ci...`)
})

test('downloadAndBuildVscodeFromCommit installs missing nested dependencies before compile', async () => {
  const testCommitHash = '3333333333333333333333333333333333333333'
  const reposDir = Path.join('/test', '.vscode-repos')
  const repoPath = Path.join(reposDir, testCommitHash)
  const gitPath = Path.join(repoPath, '.git')
  const mainJsPath = Path.join(repoPath, 'out', 'main.js')
  const nodeModulesPath = Path.join(repoPath, 'node_modules')
  const nodeModulesPackageLock = Path.join(nodeModulesPath, '.package-lock.json')
  const outPath = Path.join(repoPath, 'out')

  mockResolveCommitHash.mockImplementation(async () => ({
    commitHash: testCommitHash,
    owner: 'microsoft',
  }))

  mockPathExists.mockImplementation((path) => {
    if (path === reposDir) {
      return true
    }
    if (path === gitPath) {
      return true
    }
    if (path === mainJsPath) {
      return false
    }
    if (path === nodeModulesPath) {
      return true
    }
    if (path === nodeModulesPackageLock) {
      return true
    }
    if (path === outPath) {
      return false
    }
    return false
  })

  mockEnsureNestedDependencies.mockResolvedValue(1)

  await downloadAndBuildVscodeFromCommit('linux', 'x64', testCommitHash, DEFAULT_REPO_URL, reposDir, '', false)

  expect(mockInstallDependencies).not.toHaveBeenCalled()
  expect(mockEnsureNestedDependencies).toHaveBeenCalledWith(repoPath, false)
  expect(mockRunCompile).toHaveBeenCalledWith(repoPath, false, mainJsPath)
})

test('downloadAndBuildVscodeFromCommit repairs nested dependencies after restoring cached node_modules', async () => {
  const testCommitHash = '4444444444444444444444444444444444444444'
  const reposDir = Path.join('/test', '.vscode-repos')
  const repoPath = Path.join(reposDir, testCommitHash)
  const gitPath = Path.join(repoPath, '.git')
  const mainJsPath = Path.join(repoPath, 'out', 'main.js')
  const nodeModulesPath = Path.join(repoPath, 'node_modules')
  const nodeModulesPackageLock = Path.join(nodeModulesPath, '.package-lock.json')
  const outPath = Path.join(repoPath, 'out')
  const cachePath = '/test/cache'

  mockResolveCommitHash.mockImplementation(async () => ({
    commitHash: testCommitHash,
    owner: 'microsoft',
  }))

  mockPathExists.mockImplementation((path) => {
    if (path === reposDir) {
      return true
    }
    if (path === gitPath) {
      return true
    }
    if (path === mainJsPath) {
      return false
    }
    if (path === nodeModulesPath) {
      return false
    }
    if (path === nodeModulesPackageLock) {
      return false
    }
    if (path === outPath) {
      return true
    }
    if (typeof path === 'string' && path.startsWith(cachePath)) {
      return true
    }
    return false
  })

  await downloadAndBuildVscodeFromCommit('linux', 'x64', testCommitHash, DEFAULT_REPO_URL, reposDir, cachePath, false)

  expect(mockCopyNodeModulesFromCacheToRepositoryFolder).toHaveBeenCalled()
  expect(mockEnsureNestedDependencies).toHaveBeenCalledWith(repoPath, false)
  expect(mockRunCompile).not.toHaveBeenCalled()
})

test('downloadAndBuildVscodeFromCommit uses stable repo folder name when provided', async () => {
  const testCommitHash = '1111111111111111111111111111111111111111'
  const reposDir = Path.join('/test', '.vscode-repos')
  const repoPath = Path.join(reposDir, 'default')
  const gitPath = Path.join(repoPath, '.git')
  const mainJsPath = Path.join(repoPath, 'out', 'main.js')
  const nodeModulesPath = Path.join(repoPath, 'node_modules')
  const nodeModulesPackageLock = Path.join(nodeModulesPath, '.package-lock.json')
  const outPath = Path.join(repoPath, 'out')

  mockResolveCommitHash.mockImplementation(async () => ({
    commitHash: testCommitHash,
    owner: 'microsoft',
  }))

  mockPathExists.mockImplementation((path) => {
    if (path === reposDir) {
      return true
    }
    if (path === gitPath) {
      return false
    }
    if (path === mainJsPath) {
      return false
    }
    if (path === nodeModulesPath) {
      return false
    }
    if (path === nodeModulesPackageLock) {
      return false
    }
    if (path === outPath) {
      return false
    }
    return false
  })

  await downloadAndBuildVscodeFromCommit('linux', 'x64', testCommitHash, DEFAULT_REPO_URL, reposDir, '', false, 'default')

  expect(mockCloneRepository.mock.calls).toEqual([[DEFAULT_REPO_URL, repoPath, testCommitHash]])
  expect(mockInstallDependencies).toHaveBeenCalledWith(repoPath, false)
  expect(mockRunCompile).toHaveBeenCalledWith(repoPath, false, mainJsPath)
})

test('downloadAndBuildVscodeFromCommit updates existing stable repo to the requested commit', async () => {
  const testCommitHash = '2222222222222222222222222222222222222222'
  const reposDir = Path.join('/test', '.vscode-repos')
  const repoPath = Path.join(reposDir, 'default')
  const gitPath = Path.join(repoPath, '.git')
  const mainJsPath = Path.join(repoPath, 'out', 'main.js')
  const nodeModulesPath = Path.join(repoPath, 'node_modules')
  const nodeModulesPackageLock = Path.join(nodeModulesPath, '.package-lock.json')
  const outPath = Path.join(repoPath, 'out')

  mockResolveCommitHash.mockImplementation(async () => ({
    commitHash: testCommitHash,
    owner: 'microsoft',
  }))
  mockPathExists.mockImplementation((path) => {
    if (path === reposDir) {
      return true
    }
    if (path === gitPath) {
      return true
    }
    if (path === mainJsPath) {
      return false
    }
    if (path === nodeModulesPath) {
      return false
    }
    if (path === nodeModulesPackageLock) {
      return false
    }
    if (path === outPath) {
      return false
    }
    return false
  })

  await downloadAndBuildVscodeFromCommit('linux', 'x64', testCommitHash, DEFAULT_REPO_URL, reposDir, '', false, 'default')

  expect(mockCheckoutCommit).toHaveBeenCalledWith(repoPath, DEFAULT_REPO_URL, testCommitHash)
  expect(mockCloneRepository).not.toHaveBeenCalled()
})

test.skip('downloadVscodeCommit - tests git clone operations with mocked execa', async () => {
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

  await downloadAndBuildVscodeFromCommit('linux', 'x64', testCommitHash, testRepoUrl, testReposDir, '/test/cache', false)

  // Verify that makeDirectory was called to create the repos directory
  expect(mockMkdir).toHaveBeenCalledWith(reposDir)

  // Verify that cloneRepository was called
  expect(mockCloneRepository).toHaveBeenCalledWith(testRepoUrl, repoPath, testCommitHash)

  // Verify that logger was called for installation and compilation
  expect(mockLog).toHaveBeenCalledWith(`[repository] Installing dependencies for commit ${testCommitHash}...`)
  expect(mockLog).toHaveBeenCalledWith(`[repository] Compiling VS Code for commit ${testCommitHash}...`)
})

test.skip('downloadAndBuildVscodeFromCommit - handles interrupted workflow with missing node_modules', async () => {
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

  await downloadAndBuildVscodeFromCommit('linux', 'x64', testCommitHash, DEFAULT_REPO_URL, reposDir, '/test/cache', false)

  // Verify that installDependencies was called since cache doesn't exist
  expect(mockInstallDependencies).toHaveBeenCalled()

  // Verify that logger was called for installation
  expect(mockLog).toHaveBeenCalledWith(`[repository] Installing dependencies for commit ${testCommitHash}...`)
})

test.skip('downloadAndBuildVscodeFromCommit - handles interrupted workflow with existing node_modules', async () => {
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

  await downloadAndBuildVscodeFromCommit('linux', 'x64', testCommitHash, DEFAULT_REPO_URL, reposDir, '/test/cache', false)

  // Since main.js doesn't exist but node_modules does, it should still call installDependencies
  // because needsInstall = !existsMainJsPath && !existsNodeModulesPath = true && false = false
  // But the logic shows it will still call installDependencies if needsInstall is true
  // Let me check what the actual paths are being checked
  expect(mockPathExists).toHaveBeenCalledWith(mainJsPath)
  expect(mockPathExists).toHaveBeenCalledWith(nodeModulesPath)

  // Verify that logger was called for the skip message
  expect(mockLog).toHaveBeenCalledWith(`[repository] node_modules already exists in repo for commit ${testCommitHash}, skipping npm ci...`)
})

test.skip('downloadAndBuildVscodeFromCommit - handles interrupted workflow with existing out folder', async () => {
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

  await downloadAndBuildVscodeFromCommit('linux', 'x64', testCommitHash, DEFAULT_REPO_URL, reposDir, '/test/cache', false)

  // Since main.js doesn't exist but out folder does, it should still call runCompile
  // because needsCompile = !existsMainJsPath && !existsOutPath = true && false = false
  // But the logic shows it will still call runCompile if needsCompile is true
  // Let me check what the actual paths are being checked
  expect(mockPathExists).toHaveBeenCalledWith(mainJsPath)
  expect(mockPathExists).toHaveBeenCalledWith(outPath)

  // Verify that logger was called for the skip message
  expect(mockLog).toHaveBeenCalledWith(`[repository] node_modules already exists in repo for commit ${testCommitHash}, skipping npm ci...`)
})
