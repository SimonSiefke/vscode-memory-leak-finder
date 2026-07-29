import { beforeEach, expect, jest, test } from '@jest/globals'

const pending = (): Promise<never> => new Promise(() => {})

const mockDispose = jest.fn<() => Promise<void>>()
const workerRpc = {
  dispose: mockDispose,
  async invoke() {},
  send() {},
}

const tests = ['one.ts', 'two.ts', 'three.ts'].map((dirent) => ({
  absolutePath: `/test-root/${dirent}`,
  dirent,
  relativeDirname: '',
  relativePath: dirent,
}))

const mockGetTestsToRun = jest.fn<() => Promise<typeof tests>>()
const mockPrepareTestsAndAttach = jest.fn(async () => ({
  devtoolsWebSocketUrl: 'ws://browser',
  functionTrackerRpc: workerRpc,
  initializationWorkerRpc: workerRpc,
  memoryRpc: workerRpc,
  pid: 123,
  testWorkerRpc: workerRpc,
  videoRpc: workerRpc,
  webSocketUrl: 'ws://electron',
}))
const mockRunTests = jest.fn<() => Promise<void>>()
const mockForceKillProcessTree = jest.fn<(_pid: number) => Promise<void>>()
const mockForceKillProcessTreeFromLock = jest.fn<() => Promise<void>>()

jest.unstable_mockModule('../src/parts/GetTestToRun/GetTestsToRun.ts', () => ({
  getTestsToRun: mockGetTestsToRun,
}))

jest.unstable_mockModule('../src/parts/PrepareTestsOrAttach/PrepareTestsOrAttach.ts', () => ({
  prepareTestsAndAttach: mockPrepareTestsAndAttach,
  state: {
    promise: undefined,
  },
}))

jest.unstable_mockModule('../src/parts/TestWorkerSetupTest/TestWorkerSetupTest.ts', () => ({
  async testWorkerSetupTest() {
    return {
      skipped: false,
      wasOriginallySkipped: false,
    }
  },
}))

jest.unstable_mockModule('../src/parts/TestWorkerRunTests/TestWorkerRunTests.ts', () => ({
  testWorkerRunTests: mockRunTests,
}))

jest.unstable_mockModule('../src/parts/TestWorkerTeardownTest/TestWorkerTearDownTest.ts', () => ({
  async testWorkerTearDownTest() {},
}))

jest.unstable_mockModule('../src/parts/ForceKillProcessTree/ForceKillProcessTree.ts', () => ({
  forceKillProcessTree: mockForceKillProcessTree,
  forceKillProcessTreeFromLock: mockForceKillProcessTreeFromLock,
}))

jest.unstable_mockModule('../src/parts/GetPrettyError/GetPrettyError.ts', () => ({
  async getPrettyError(error) {
    return error
  },
}))

const { runTestsWithCallback } = await import('../src/parts/RunTestsWithCallback/RunTestsWithCallback.ts')

const getOptions = (restartBetween = false) => ({
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
  getTimeStamp: () => Date.now(),
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
  restartBetween,
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

beforeEach(() => {
  jest.clearAllMocks()
  mockDispose.mockResolvedValue()
  mockForceKillProcessTree.mockResolvedValue()
  mockForceKillProcessTreeFromLock.mockResolvedValue()
  mockGetTestsToRun.mockResolvedValue(tests.slice(0, 2))
  mockPrepareTestsAndAttach.mockResolvedValue({
    devtoolsWebSocketUrl: 'ws://browser',
    functionTrackerRpc: workerRpc,
    initializationWorkerRpc: workerRpc,
    memoryRpc: workerRpc,
    pid: 123,
    testWorkerRpc: workerRpc,
    videoRpc: workerRpc,
    webSocketUrl: 'ws://electron',
  })
  mockRunTests.mockResolvedValue()
})

test('continues with a fresh instance after a test RPC hangs', async () => {
  jest.useFakeTimers()
  mockRunTests.mockImplementationOnce(pending)

  const resultPromise = runTestsWithCallback(getOptions())
  await jest.advanceTimersByTimeAsync(600_000)
  const result = await resultPromise

  expect(result).toEqual(
    expect.objectContaining({
      failed: 1,
      passed: 1,
      type: 'success',
    }),
  )
  expect(mockPrepareTestsAndAttach).toHaveBeenCalledTimes(2)
  expect(mockForceKillProcessTree).toHaveBeenCalledWith(123)
  jest.useRealTimers()
})

test('continues with the next test after preparation hangs', async () => {
  jest.useFakeTimers()
  mockPrepareTestsAndAttach.mockImplementationOnce(pending)

  const resultPromise = runTestsWithCallback(getOptions())
  await jest.advanceTimersByTimeAsync(120_000)
  const result = await resultPromise

  expect(result).toEqual(
    expect.objectContaining({
      failed: 1,
      passed: 1,
      type: 'success',
    }),
  )
  expect(mockPrepareTestsAndAttach).toHaveBeenCalledTimes(2)
  expect(mockForceKillProcessTreeFromLock).toHaveBeenCalledTimes(1)
  jest.useRealTimers()
})

test('continues with a fresh instance after worker disposal hangs', async () => {
  jest.useFakeTimers()
  mockGetTestsToRun.mockResolvedValue(tests)
  mockDispose.mockImplementationOnce(pending)

  const resultPromise = runTestsWithCallback(getOptions(true))
  await jest.advanceTimersByTimeAsync(30_000)
  const result = await resultPromise

  expect(result).toEqual(
    expect.objectContaining({
      failed: 1,
      passed: 2,
      type: 'success',
    }),
  )
  expect(mockPrepareTestsAndAttach).toHaveBeenCalledTimes(2)
  expect(mockForceKillProcessTree).toHaveBeenCalledWith(123)
  jest.useRealTimers()
})
