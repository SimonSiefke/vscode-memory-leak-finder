import { beforeEach, expect, jest, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import * as StdoutWorker from '../src/parts/StdoutWorker/StdoutWorker.ts'

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
})

jest.unstable_mockModule('../src/parts/Stdout/Stdout.ts', () => {
  return {
    write: jest.fn().mockImplementation(async () => {}),
  }
})

const mockRpc = MockRpc.create({
  commandMap: {},
  invoke: (method: string) => {
    if (method === 'Stdout.getWatchUsageMessage') {
      return 'watch usage'
    }
    throw new Error(`unexpected method ${method}`)
  },
})

StdoutWorker.set(mockRpc)

jest.unstable_mockModule('../src/parts/WatchUsage/WatchUsage.ts', () => {
  return {
    print: jest.fn(() => 'watch usage'),
  }
})

jest.unstable_mockModule('../src/parts/SpecialStdin/SpecialStdin.ts', () => {
  return {
    start: jest.fn(),
  }
})

jest.unstable_mockModule('../src/parts/StartRunning/StartRunning.ts', () => {
  return {
    startRunning: jest.fn(),
  }
})

jest.unstable_mockModule('../src/parts/ConvertProxyRequestsToMocks/ConvertProxyRequestsToMocks.ts', () => {
  return {
    convertProxyRequestsToMocks: jest.fn(),
  }
})

jest.unstable_mockModule('../src/parts/ComputeVscodeNodeModulesCacheKeyFromCommit/ComputeVscodeNodeModulesCacheKeyFromCommit.ts', () => {
  return {
    computeVscodeNodeModulesCacheKeyFromCommit: jest.fn(),
  }
})

jest.unstable_mockModule('../src/parts/ResolveVscodeCommitHashFromCommit/ResolveVscodeCommitHashFromCommit.ts', () => {
  return {
    resolveVscodeCommitHashFromCommit: jest.fn(),
  }
})

jest.unstable_mockModule('../src/parts/CreateAllMockDataZip/CreateAllMockDataZip.ts', () => {
  return {
    createAllMockDataZip: jest.fn(),
  }
})

const Stdout = await import('../src/parts/Stdout/Stdout.ts')
const ComputeVscodeNodeModulesCacheKeyFromCommit =
  await import('../src/parts/ComputeVscodeNodeModulesCacheKeyFromCommit/ComputeVscodeNodeModulesCacheKeyFromCommit.ts')
const ConvertProxyRequestsToMocks = await import('../src/parts/ConvertProxyRequestsToMocks/ConvertProxyRequestsToMocks.ts')
const InitialStart = await import('../src/parts/InitialStart/InitialStart.ts')
const ResolveVscodeCommitHashFromCommit =
  await import('../src/parts/ResolveVscodeCommitHashFromCommit/ResolveVscodeCommitHashFromCommit.ts')
const SpecialStdin = await import('../src/parts/SpecialStdin/SpecialStdin.ts')
const StartRunning = await import('../src/parts/StartRunning/StartRunning.ts')
const WatchUsage = await import('../src/parts/WatchUsage/WatchUsage.ts')

test('initialStart - watch mode - show details', async () => {
  const options: ReturnType<typeof import('../src/parts/ParseArgv/ParseArgv.ts').parseArgv> & { isGithubActions: boolean } = {
    allowCopilotAuthInCi: false,
    arch: '',
    bisect: false,
    checkLeaks: false,
    clearExtensions: true,
    color: true,
    commit: '',
    compressVideo: false,
    computeVscodeNodeModulesCacheKey: false,
    continueValue: '',
    convertRequestsToMocks: false,
    createAllMockDataZip: false,
    cwd: '',
    disableVscodeNodeModulesCache: false,
    downloadUserDataZipFileToken: '',
    downloadUserDataZipFileUrl: '',
    enableExtensions: false,
    enableProxy: false,
    filter: '',
    headless: false,
    ide: '',
    ideVersion: '',
    insidersCommit: '',
    inspectIntegratedBrowser: false,
    inspectProcess: '',
    inspectExtensions: false,
    inspectExtensionsPort: 0,
    inspectPtyHost: false,
    inspectPtyHostPort: 0,
    inspectSharedProcess: false,
    inspectSharedProcessPort: 0,
    isGithubActions: false,
    isWindows: false,
    login: false,
    measure: '',
    measureAfter: false,
    measureNode: false,
    openDevtools: false,
    pageObjectPath: '',
    platform: '',
    processRootStrategy: 'launch-pid',
    recordVideo: false,
    resolveExtensionSourceMaps: false,
    resolveVscodeCommitHash: false,
    restartBetween: false,
    runMode: 0,
    runs: 1,
    runSkippedTestsAnyway: false,
    screencastQuality: 90,
    setupOnly: false,
    timeoutBetween: 0,
    timeouts: true,
    trackFunctions: false,
    updateUrl: '',
    useProxyMock: false,
    useStableVscodeRepoPath: false,
    verbose: false,
    vscodePath: '',
    vscodeVersion: '',
    watch: true,
    workers: false,
  }
  // @ts-ignore
  WatchUsage.print.mockImplementation(async () => 'watch usage')
  await InitialStart.initialStart(options)
  expect(SpecialStdin.start).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith('watch usage')
  expect(StartRunning.startRunning).not.toHaveBeenCalled()
})

test('initialStart - watch mode - start running', async () => {
  const options: ReturnType<typeof import('../src/parts/ParseArgv/ParseArgv.ts').parseArgv> & { isGithubActions: boolean } = {
    allowCopilotAuthInCi: false,
    arch: '',
    bisect: false,
    checkLeaks: false,
    clearExtensions: true,
    color: true,
    commit: '',
    compressVideo: false,
    computeVscodeNodeModulesCacheKey: false,
    continueValue: '',
    convertRequestsToMocks: false,
    createAllMockDataZip: false,
    cwd: '',
    disableVscodeNodeModulesCache: false,
    downloadUserDataZipFileToken: '',
    downloadUserDataZipFileUrl: '',
    enableExtensions: false,
    enableProxy: false,
    filter: 'a',
    headless: false,
    ide: '',
    ideVersion: '',
    insidersCommit: '',
    inspectIntegratedBrowser: false,
    inspectProcess: '',
    inspectExtensions: false,
    inspectExtensionsPort: 0,
    inspectPtyHost: false,
    inspectPtyHostPort: 0,
    inspectSharedProcess: false,
    inspectSharedProcessPort: 0,
    isGithubActions: false,
    isWindows: false,
    login: false,
    measure: '',
    measureAfter: false,
    measureNode: false,
    openDevtools: false,
    pageObjectPath: '',
    platform: '',
    processRootStrategy: 'launch-pid',
    recordVideo: false,
    resolveExtensionSourceMaps: false,
    resolveVscodeCommitHash: false,
    restartBetween: false,
    runMode: 0,
    runs: 1,
    runSkippedTestsAnyway: false,
    screencastQuality: 90,
    setupOnly: false,
    timeoutBetween: 0,
    timeouts: true,
    trackFunctions: false,
    updateUrl: '',
    useProxyMock: false,
    useStableVscodeRepoPath: false,
    verbose: false,
    vscodePath: '',
    vscodeVersion: '',
    watch: true,
    workers: false,
  }
  await InitialStart.initialStart(options)
  expect(SpecialStdin.start).toHaveBeenCalledTimes(1)
  expect(Stdout.write).not.toHaveBeenCalled()
  expect(StartRunning.startRunning).toHaveBeenCalledTimes(1)
  expect(StartRunning.startRunning).toHaveBeenCalledWith(expect.objectContaining({ filterValue: 'a' }))
})

test('initialStart - start running', async () => {
  const options: ReturnType<typeof import('../src/parts/ParseArgv/ParseArgv.ts').parseArgv> & { isGithubActions: boolean } = {
    allowCopilotAuthInCi: false,
    arch: '',
    bisect: false,
    checkLeaks: false,
    clearExtensions: true,
    color: true,
    commit: '',
    compressVideo: false,
    computeVscodeNodeModulesCacheKey: false,
    continueValue: '',
    convertRequestsToMocks: false,
    createAllMockDataZip: false,
    cwd: '',
    disableVscodeNodeModulesCache: false,
    downloadUserDataZipFileToken: '',
    downloadUserDataZipFileUrl: '',
    enableExtensions: false,
    enableProxy: false,
    filter: 'a',
    headless: false,
    ide: '',
    ideVersion: '',
    insidersCommit: '',
    inspectIntegratedBrowser: false,
    inspectProcess: '',
    inspectExtensions: false,
    inspectExtensionsPort: 0,
    inspectPtyHost: false,
    inspectPtyHostPort: 0,
    inspectSharedProcess: false,
    inspectSharedProcessPort: 0,
    isGithubActions: false,
    isWindows: false,
    login: false,
    measure: '',
    measureAfter: false,
    measureNode: false,
    openDevtools: false,
    pageObjectPath: '',
    platform: '',
    processRootStrategy: 'launch-pid',
    recordVideo: false,
    resolveExtensionSourceMaps: false,
    resolveVscodeCommitHash: false,
    restartBetween: false,
    runMode: 0,
    runs: 1,
    runSkippedTestsAnyway: false,
    screencastQuality: 90,
    setupOnly: false,
    timeoutBetween: 0,
    timeouts: true,
    trackFunctions: false,
    updateUrl: '',
    useProxyMock: false,
    useStableVscodeRepoPath: false,
    verbose: false,
    vscodePath: '',
    vscodeVersion: '',
    watch: false,
    workers: false,
  }
  await InitialStart.initialStart(options)
  expect(SpecialStdin.start).not.toHaveBeenCalled()
  expect(Stdout.write).not.toHaveBeenCalled()
  expect(StartRunning.startRunning).toHaveBeenCalledTimes(1)
  expect(StartRunning.startRunning).toHaveBeenCalledWith(expect.objectContaining({ filterValue: 'a' }))
})

test('initialStart - convert requests to mocks', async () => {
  const options: ReturnType<typeof import('../src/parts/ParseArgv/ParseArgv.ts').parseArgv> & { isGithubActions: boolean } = {
    allowCopilotAuthInCi: false,
    arch: '',
    bisect: false,
    checkLeaks: false,
    clearExtensions: true,
    color: true,
    commit: '',
    compressVideo: false,
    computeVscodeNodeModulesCacheKey: false,
    continueValue: '',
    convertRequestsToMocks: true,
    createAllMockDataZip: false,
    cwd: '',
    disableVscodeNodeModulesCache: false,
    downloadUserDataZipFileToken: '',
    downloadUserDataZipFileUrl: '',
    enableExtensions: false,
    enableProxy: false,
    filter: 'a',
    headless: false,
    ide: '',
    ideVersion: '',
    insidersCommit: '',
    inspectIntegratedBrowser: false,
    inspectProcess: '',
    inspectExtensions: false,
    inspectExtensionsPort: 0,
    inspectPtyHost: false,
    inspectPtyHostPort: 0,
    inspectSharedProcess: false,
    inspectSharedProcessPort: 0,
    isGithubActions: false,
    isWindows: false,
    login: false,
    measure: '',
    measureAfter: false,
    measureNode: false,
    openDevtools: false,
    pageObjectPath: '',
    platform: '',
    processRootStrategy: 'launch-pid',
    recordVideo: false,
    resolveExtensionSourceMaps: false,
    resolveVscodeCommitHash: false,
    restartBetween: false,
    runMode: 0,
    runs: 1,
    runSkippedTestsAnyway: false,
    screencastQuality: 90,
    setupOnly: false,
    timeoutBetween: 0,
    timeouts: true,
    trackFunctions: false,
    updateUrl: '',
    useProxyMock: false,
    useStableVscodeRepoPath: false,
    verbose: false,
    vscodePath: '',
    vscodeVersion: '',
    watch: false,
    workers: false,
  }
  await InitialStart.initialStart(options)
  expect(ConvertProxyRequestsToMocks.convertProxyRequestsToMocks).toHaveBeenCalledTimes(1)
  expect(SpecialStdin.start).not.toHaveBeenCalled()
  expect(Stdout.write).not.toHaveBeenCalled()
  expect(StartRunning.startRunning).not.toHaveBeenCalled()
})

test('initialStart - enables environment flag for disabling vscode node modules cache', async () => {
  const previousValue = process.env.VSCODE_MEMORY_LEAK_FINDER_DISABLE_VSCODE_NODE_MODULES_CACHE
  const options: ReturnType<typeof import('../src/parts/ParseArgv/ParseArgv.ts').parseArgv> & { isGithubActions: boolean } = {
    allowCopilotAuthInCi: false,
    arch: '',
    bisect: false,
    checkLeaks: false,
    clearExtensions: true,
    color: true,
    commit: '',
    compressVideo: false,
    computeVscodeNodeModulesCacheKey: false,
    continueValue: '',
    convertRequestsToMocks: false,
    createAllMockDataZip: false,
    cwd: '',
    disableVscodeNodeModulesCache: true,
    downloadUserDataZipFileToken: '',
    downloadUserDataZipFileUrl: '',
    enableExtensions: false,
    enableProxy: false,
    filter: 'a',
    headless: false,
    ide: '',
    ideVersion: '',
    insidersCommit: '',
    inspectIntegratedBrowser: false,
    inspectProcess: '',
    inspectExtensions: false,
    inspectExtensionsPort: 0,
    inspectPtyHost: false,
    inspectPtyHostPort: 0,
    inspectSharedProcess: false,
    inspectSharedProcessPort: 0,
    isGithubActions: false,
    isWindows: false,
    login: false,
    measure: '',
    measureAfter: false,
    measureNode: false,
    openDevtools: false,
    pageObjectPath: '',
    platform: '',
    processRootStrategy: 'launch-pid',
    recordVideo: false,
    resolveExtensionSourceMaps: false,
    resolveVscodeCommitHash: false,
    restartBetween: false,
    runMode: 0,
    runs: 1,
    runSkippedTestsAnyway: false,
    screencastQuality: 90,
    setupOnly: false,
    timeoutBetween: 0,
    timeouts: true,
    trackFunctions: false,
    updateUrl: '',
    useProxyMock: false,
    useStableVscodeRepoPath: false,
    verbose: false,
    vscodePath: '',
    vscodeVersion: '',
    watch: false,
    workers: false,
  }

  try {
    await InitialStart.initialStart(options)
    expect(process.env.VSCODE_MEMORY_LEAK_FINDER_DISABLE_VSCODE_NODE_MODULES_CACHE).toBe('1')
  } finally {
    if (typeof previousValue === 'string') {
      process.env.VSCODE_MEMORY_LEAK_FINDER_DISABLE_VSCODE_NODE_MODULES_CACHE = previousValue
    } else {
      delete process.env.VSCODE_MEMORY_LEAK_FINDER_DISABLE_VSCODE_NODE_MODULES_CACHE
    }
  }
})

test('initialStart - computes vscode node modules cache key from commit', async () => {
  const options: ReturnType<typeof import('../src/parts/ParseArgv/ParseArgv.ts').parseArgv> & { isGithubActions: boolean } = {
    allowCopilotAuthInCi: false,
    arch: '',
    bisect: false,
    checkLeaks: false,
    clearExtensions: true,
    color: true,
    commit: 'abc123',
    compressVideo: false,
    computeVscodeNodeModulesCacheKey: true,
    continueValue: '',
    convertRequestsToMocks: false,
    createAllMockDataZip: false,
    cwd: '',
    disableVscodeNodeModulesCache: false,
    downloadUserDataZipFileToken: '',
    downloadUserDataZipFileUrl: '',
    enableExtensions: false,
    enableProxy: false,
    filter: 'a',
    headless: false,
    ide: '',
    ideVersion: '',
    insidersCommit: '',
    inspectIntegratedBrowser: false,
    inspectProcess: '',
    inspectExtensions: false,
    inspectExtensionsPort: 0,
    inspectPtyHost: false,
    inspectPtyHostPort: 0,
    inspectSharedProcess: false,
    inspectSharedProcessPort: 0,
    isGithubActions: false,
    isWindows: false,
    login: false,
    measure: '',
    measureAfter: false,
    measureNode: false,
    openDevtools: false,
    pageObjectPath: '',
    platform: '',
    processRootStrategy: 'launch-pid',
    recordVideo: false,
    resolveExtensionSourceMaps: false,
    resolveVscodeCommitHash: false,
    restartBetween: false,
    runMode: 0,
    runs: 1,
    runSkippedTestsAnyway: false,
    screencastQuality: 90,
    setupOnly: false,
    timeoutBetween: 0,
    timeouts: true,
    trackFunctions: false,
    updateUrl: '',
    useProxyMock: false,
    useStableVscodeRepoPath: false,
    verbose: true,
    vscodePath: '',
    vscodeVersion: '',
    watch: false,
    workers: false,
  }

  await InitialStart.initialStart(options)
  expect(ComputeVscodeNodeModulesCacheKeyFromCommit.computeVscodeNodeModulesCacheKeyFromCommit).toHaveBeenCalledTimes(1)
  expect(ComputeVscodeNodeModulesCacheKeyFromCommit.computeVscodeNodeModulesCacheKeyFromCommit).toHaveBeenCalledWith('abc123', true)
  expect(StartRunning.startRunning).not.toHaveBeenCalled()
})

test('initialStart - resolve vscode commit hash', async () => {
  const options: ReturnType<typeof import('../src/parts/ParseArgv/ParseArgv.ts').parseArgv> & { isGithubActions: boolean } = {
    allowCopilotAuthInCi: false,
    arch: '',
    bisect: false,
    checkLeaks: false,
    clearExtensions: true,
    color: true,
    commit: 'abc123',
    compressVideo: false,
    computeVscodeNodeModulesCacheKey: false,
    continueValue: '',
    convertRequestsToMocks: false,
    createAllMockDataZip: false,
    cwd: '',
    disableVscodeNodeModulesCache: false,
    downloadUserDataZipFileToken: '',
    downloadUserDataZipFileUrl: '',
    enableExtensions: false,
    enableProxy: false,
    filter: 'a',
    headless: false,
    ide: '',
    ideVersion: '',
    insidersCommit: '',
    inspectIntegratedBrowser: false,
    inspectProcess: '',
    inspectExtensions: false,
    inspectExtensionsPort: 0,
    inspectPtyHost: false,
    inspectPtyHostPort: 0,
    inspectSharedProcess: false,
    inspectSharedProcessPort: 0,
    isGithubActions: false,
    isWindows: false,
    login: false,
    measure: '',
    measureAfter: false,
    measureNode: false,
    openDevtools: false,
    pageObjectPath: '',
    platform: '',
    processRootStrategy: 'launch-pid',
    recordVideo: false,
    resolveExtensionSourceMaps: false,
    resolveVscodeCommitHash: true,
    restartBetween: false,
    runMode: 0,
    runs: 1,
    runSkippedTestsAnyway: false,
    screencastQuality: 90,
    setupOnly: false,
    timeoutBetween: 0,
    timeouts: true,
    trackFunctions: false,
    updateUrl: '',
    useProxyMock: false,
    useStableVscodeRepoPath: false,
    verbose: false,
    vscodePath: '',
    vscodeVersion: '',
    watch: false,
    workers: false,
  }

  await InitialStart.initialStart(options)
  expect(ResolveVscodeCommitHashFromCommit.resolveVscodeCommitHashFromCommit).toHaveBeenCalledTimes(1)
  expect(ResolveVscodeCommitHashFromCommit.resolveVscodeCommitHashFromCommit).toHaveBeenCalledWith('abc123')
  expect(StartRunning.startRunning).not.toHaveBeenCalled()
})

test('cli run - create all mock data zip flag', async () => {
  const Cli = await import('../src/parts/Cli/Cli.ts')
  const CreateAllMockDataZip = await import('../src/parts/CreateAllMockDataZip/CreateAllMockDataZip.ts')

  await Cli.run('linux', 'x64', ['--create-all-mock-data-zip'], {})

  expect(CreateAllMockDataZip.createAllMockDataZip).toHaveBeenCalledTimes(1)
  expect(StartRunning.startRunning).not.toHaveBeenCalled()
})
