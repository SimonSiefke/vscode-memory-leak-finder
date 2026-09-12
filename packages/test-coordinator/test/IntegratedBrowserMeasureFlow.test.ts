import { beforeEach, expect, jest, test } from '@jest/globals'
import { join } from 'node:path'

const events: string[] = []
let hangNextWorkerDispose = false

const rpc = {
  async dispose() {
    if (hangNextWorkerDispose) {
      hangNextWorkerDispose = false
      await new Promise(() => {})
    }
  },
  async invoke() {},
  send() {},
}

const memoryRpc = {
  async dispose() {
    events.push('memory-dispose')
  },
  async invoke() {},
  send() {},
}

const mockGetTestsToRun = jest.fn(async () => [
  {
    absolutePath: '/test-root/src/react-vite-simple-browser.ts',
    dirent: 'react-vite-simple-browser.ts',
    relativeDirname: 'src',
    relativePath: 'src/react-vite-simple-browser.ts',
  },
])
const mockPrepareTestsAndAttach = jest.fn(async () => ({
  devtoolsWebSocketUrl: 'ws://browser',
  functionTrackerRpc: rpc,
  initializationWorkerRpc: rpc,
  memoryRpc: rpc,
  pid: 123,
  testWorkerRpc: rpc,
  videoRpc: rpc,
  webSocketUrl: 'ws://electron',
}))
const mockGetBrowserPageTargetIds = jest.fn(async () => {
  events.push('snapshot-targets')
  return ['existing-target']
})
const mockSetupTest = jest.fn(async () => {
  events.push('setup-test')
  return {
    skipped: false,
    wasOriginallySkipped: false,
  }
})
const mockStartWorker = jest.fn(async (..._args: readonly unknown[]) => {
  events.push('start-memory-worker')
  return memoryRpc
})
const mockMemoryStart = jest.fn(async () => {
  events.push('measure-start')
})
const mockMemoryStop = jest.fn(async () => undefined)
const mockMemoryCompare = jest.fn(async (..._args: readonly unknown[]) => ({
  isLeak: false,
  summary: '',
}))

jest.unstable_mockModule('../src/parts/GetTestToRun/GetTestsToRun.ts', () => ({
  getTestsToRun: mockGetTestsToRun,
}))

jest.unstable_mockModule('../src/parts/PrepareTestsOrAttach/PrepareTestsOrAttach.ts', () => ({
  prepareTestsAndAttach: mockPrepareTestsAndAttach,
  state: {
    promise: undefined,
  },
}))

jest.unstable_mockModule('../src/parts/BrowserPageTargets/BrowserPageTargets.ts', () => ({
  getBrowserPageTargetIds: mockGetBrowserPageTargetIds,
}))

jest.unstable_mockModule('../src/parts/TestWorkerSetupTest/TestWorkerSetupTest.ts', () => ({
  testWorkerSetupTest: mockSetupTest,
}))

jest.unstable_mockModule('../src/parts/MemoryLeakWorker/MemoryLeakWorker.ts', () => ({
  startWorker: mockStartWorker,
}))

jest.unstable_mockModule('../src/parts/MemoryLeakFinder/MemoryLeakFinder.ts', () => ({
  compare: mockMemoryCompare,
  start: mockMemoryStart,
  stop: mockMemoryStop,
}))

jest.unstable_mockModule('../src/parts/TestWorkerRunTests/TestWorkerRunTests.ts', () => ({
  testWorkerRunTests: jest.fn(async () => undefined),
}))

jest.unstable_mockModule('../src/parts/TestWorkerTeardownTest/TestWorkerTearDownTest.ts', () => ({
  testWorkerTearDownTest: jest.fn(async () => undefined),
}))

jest.unstable_mockModule('../src/parts/VideoRecording/VideoRecording.ts', () => ({
  addChapter: jest.fn(async () => undefined),
  finalize: jest.fn(async () => undefined),
}))

const { runTestsWithCallback } = await import('../src/parts/RunTestsWithCallback/RunTestsWithCallback.ts')

beforeEach(() => {
  events.length = 0
  hangNextWorkerDispose = false
  jest.clearAllMocks()
})

test('runTestsWithCallback - inspect integrated browser starts memory worker after setup', async () => {
  const result = await runTestsWithCallback({
    addDisposable: () => {},
    allowCopilotAuthInCi: false,
    arch: 'x64',
    buildVscodeMinified: false,
    callback: async () => {},
    checkLeaks: true,
    clearDisposables: async () => {},
    clearExtensions: false,
    color: false,
    commit: 'abc123',
    compressVideo: false,
    continueValue: '',
    cwd: '/test-cwd',
    downloadUserDataZipFileToken: '',
    downloadUserDataZipFileUrl: '',
    enableExtensions: false,
    enableProxy: false,
    filterValue: 'react-vite-simple-browser',
    getTimeStamp: () => 0,
    headlessMode: true,
    ide: 'vscode',
    ideVersion: 'stable',
    insidersCommit: '',
    inspectExtensions: false,
    inspectExtensionsPort: 0,
    inspectIntegratedBrowser: true,
    inspectPtyHost: false,
    inspectPtyHostPort: 0,
    inspectSharedProcess: false,
    inspectSharedProcessPort: 0,
    isGithubActions: false,
    login: false,
    measure: 'named-function-count3',
    measureAfter: false,
    measureNode: false,
    openDevtools: false,
    pageObjectPath: '',
    platform: 'linux',
    recordVideo: false,
    restartBetween: false,
    root: '/test-root',
    runMode: 1,
    runNetworkTestsAnyway: false,
    runs: 1,
    runSkippedTestsAnyway: true,
    screencastQuality: 100,
    setupOnly: false,
    startupRuns: 1,
    timeoutBetween: 0,
    timeouts: false,
    trackFunctions: false,
    updateUrl: '',
    useProxyMock: false,
    vscodePath: '',
    vscodeVersion: '1.0.0',
  })

  expect(result.type).toBe('success')
  expect(events).toEqual(['snapshot-targets', 'setup-test', 'start-memory-worker', 'measure-start', 'memory-dispose'])
  expect(mockStartWorker).toHaveBeenCalledWith(
    'ws://browser',
    'ws://electron',
    expect.any(Number),
    'named-function-count3',
    expect.any(Number),
    false,
    false,
    false,
    true,
    false,
    0,
    0,
    0,
    123,
    ['existing-target'],
  )
})

test('runTestsWithCallback - minimal reproduction result path uses scenario name', async () => {
  const previousMinimalReproduction = process.env.MINIMAL_REPRODUCTION
  process.env.MINIMAL_REPRODUCTION = 'headlessui-closebutton-link'
  mockGetTestsToRun.mockResolvedValueOnce([
    {
      absolutePath: '/test-root/src/minimal-reproduction.ts',
      dirent: 'minimal-reproduction.ts',
      relativeDirname: 'src',
      relativePath: 'src/minimal-reproduction.ts',
    },
  ])
  try {
    const result = await runTestsWithCallback({
      addDisposable: () => {},
      allowCopilotAuthInCi: false,
      arch: 'x64',
      buildVscodeMinified: false,
      callback: async () => {},
      checkLeaks: true,
      clearDisposables: async () => {},
      clearExtensions: false,
      color: false,
      commit: 'abc123',
      compressVideo: false,
      continueValue: '',
      cwd: '/test-cwd',
      downloadUserDataZipFileToken: '',
      downloadUserDataZipFileUrl: '',
      enableExtensions: false,
      enableProxy: false,
      filterValue: 'minimal-reproduction',
      getTimeStamp: () => 0,
      headlessMode: true,
      ide: 'vscode',
      ideVersion: 'stable',
      insidersCommit: '',
      inspectExtensions: false,
      inspectExtensionsPort: 0,
      inspectIntegratedBrowser: true,
      inspectPtyHost: false,
      inspectPtyHostPort: 0,
      inspectSharedProcess: false,
      inspectSharedProcessPort: 0,
      isGithubActions: false,
      login: false,
      measure: 'named-function-count3',
      measureAfter: false,
      measureNode: false,
      openDevtools: false,
      pageObjectPath: '',
      platform: 'linux',
      recordVideo: false,
      restartBetween: false,
      root: '/test-root',
      runMode: 1,
      runNetworkTestsAnyway: false,
      runs: 1,
      runSkippedTestsAnyway: true,
      screencastQuality: 100,
      setupOnly: false,
      startupRuns: 1,
      timeoutBetween: 0,
      timeouts: false,
      trackFunctions: false,
      updateUrl: '',
      useProxyMock: false,
      vscodePath: '',
      vscodeVersion: '1.0.0',
    })

    expect(result.type).toBe('success')
    expect(mockMemoryCompare).toHaveBeenCalledWith(
      memoryRpc,
      expect.any(Number),
      { runs: 1 },
      expect.stringContaining(
        join('integrated-browser', 'named-function-count3', 'minimal-reproductions', 'headlessui-closebutton-link.json'),
      ),
    )
  } finally {
    if (typeof previousMinimalReproduction === 'string') {
      process.env.MINIMAL_REPRODUCTION = previousMinimalReproduction
    } else {
      delete process.env.MINIMAL_REPRODUCTION
    }
  }
})

test('runTestsWithCallback - inspect process starts memory worker after setup', async () => {
  const result = await runTestsWithCallback({
    addDisposable: () => {},
    allowCopilotAuthInCi: false,
    arch: 'x64',
    buildVscodeMinified: false,
    callback: async () => {},
    checkLeaks: true,
    clearDisposables: async () => {},
    clearExtensions: false,
    color: false,
    commit: 'abc123',
    compressVideo: false,
    continueValue: '',
    cwd: '/test-cwd',
    downloadUserDataZipFileToken: '',
    downloadUserDataZipFileUrl: '',
    enableExtensions: false,
    enableProxy: false,
    filterValue: 'react-vite-simple-browser',
    getTimeStamp: () => 0,
    headlessMode: true,
    ide: 'vscode',
    ideVersion: 'stable',
    insidersCommit: '',
    inspectExtensions: false,
    inspectExtensionsPort: 0,
    inspectIntegratedBrowser: false,
    inspectProcess: 'vite.js',
    inspectPtyHost: false,
    inspectPtyHostPort: 0,
    inspectSharedProcess: false,
    inspectSharedProcessPort: 0,
    isGithubActions: false,
    login: false,
    measure: 'named-function-count3',
    measureAfter: false,
    measureNode: false,
    openDevtools: false,
    pageObjectPath: '',
    platform: 'linux',
    recordVideo: false,
    restartBetween: false,
    root: '/test-root',
    runMode: 1,
    runNetworkTestsAnyway: false,
    runs: 1,
    runSkippedTestsAnyway: true,
    screencastQuality: 100,
    setupOnly: false,
    startupRuns: 1,
    timeoutBetween: 0,
    timeouts: false,
    trackFunctions: false,
    updateUrl: '',
    useProxyMock: false,
    vscodePath: '',
    vscodeVersion: '1.0.0',
  })

  expect(result.type).toBe('success')
  expect(events).toEqual(['setup-test', 'start-memory-worker', 'measure-start', 'memory-dispose'])
  expect(mockGetBrowserPageTargetIds).not.toHaveBeenCalled()
  expect(mockStartWorker).toHaveBeenCalledWith(
    'ws://browser',
    'ws://electron',
    expect.any(Number),
    'named-function-count3',
    expect.any(Number),
    false,
    false,
    false,
    false,
    false,
    0,
    0,
    0,
    123,
    [],
    'vite.js',
    rpc,
  )
  expect(mockMemoryCompare).toHaveBeenCalledWith(
    memoryRpc,
    expect.any(Number),
    { runs: 1 },
    expect.stringContaining(join('process', 'vite.js', 'named-function-count3', 'react-vite-simple-browser.json')),
  )
})

test('runTestsWithCallback - restart between tests does not hang when a worker fails to dispose', async () => {
  jest.useFakeTimers()
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
  mockGetTestsToRun.mockResolvedValueOnce([
    {
      absolutePath: '/test-root/src/first.ts',
      dirent: 'first.ts',
      relativeDirname: 'src',
      relativePath: 'src/first.ts',
    },
    {
      absolutePath: '/test-root/src/second.ts',
      dirent: 'second.ts',
      relativeDirname: 'src',
      relativePath: 'src/second.ts',
    },
  ])
  hangNextWorkerDispose = true

  try {
    const runPromise = runTestsWithCallback({
      addDisposable: () => {},
      allowCopilotAuthInCi: false,
      arch: 'x64',
      buildVscodeMinified: false,
      callback: async () => {},
      checkLeaks: false,
      clearDisposables: async () => {},
      clearExtensions: false,
      color: false,
      commit: 'abc123',
      compressVideo: false,
      continueValue: '',
      cwd: '/test-cwd',
      downloadUserDataZipFileToken: '',
      downloadUserDataZipFileUrl: '',
      enableExtensions: false,
      enableProxy: false,
      filterValue: '',
      getTimeStamp: () => 0,
      headlessMode: true,
      ide: 'vscode',
      ideVersion: 'stable',
      insidersCommit: '',
      inspectExtensions: false,
      inspectExtensionsPort: 0,
      inspectIntegratedBrowser: false,
      inspectPtyHost: false,
      inspectPtyHostPort: 0,
      inspectSharedProcess: false,
      inspectSharedProcessPort: 0,
      isGithubActions: false,
      login: false,
      measure: '',
      measureAfter: false,
      measureNode: false,
      openDevtools: false,
      pageObjectPath: '',
      platform: 'linux',
      recordVideo: false,
      restartBetween: true,
      root: '/test-root',
      runMode: 1,
      runNetworkTestsAnyway: false,
      runs: 1,
      runSkippedTestsAnyway: false,
      screencastQuality: 100,
      setupOnly: false,
      startupRuns: 1,
      timeoutBetween: 0,
      timeouts: false,
      trackFunctions: false,
      updateUrl: '',
      useProxyMock: false,
      vscodePath: '',
      vscodeVersion: '1.0.0',
    })
    const completedBeforeWatchdog = Promise.race([
      runPromise.then(() => true),
      new Promise<false>((resolve) => setTimeout(() => resolve(false), 10_001)),
    ])

    await jest.advanceTimersByTimeAsync(10_001)

    expect(await completedBeforeWatchdog).toBe(true)
    expect((await runPromise).type).toBe('success')
    expect(mockPrepareTestsAndAttach).toHaveBeenCalledTimes(2)
    expect(warn).toHaveBeenCalledWith('Timed out disposing function tracker worker after 10000ms')
  } finally {
    warn.mockRestore()
    jest.useRealTimers()
  }
})
