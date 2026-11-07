import { beforeEach, expect, jest, test } from '@jest/globals'

const workers: any[] = []
const prepare = jest.fn(async () => {
  const rpc = () => ({ dispose: jest.fn(async () => {}) })
  const worker = {
    devtoolsWebSocketUrl: 'ws://localhost/devtools',
    webSocketUrl: 'ws://localhost/node',
    pid: 123,
    functionTrackerRpc: rpc(),
    initializationWorkerRpc: rpc(),
    memoryRpc: rpc(),
    testWorkerRpc: rpc(),
    videoRpc: rpc(),
  }
  workers.push(worker)
  return worker
})
const setup = jest.fn<(...args: any[]) => Promise<any>>()
const run = jest.fn<(...args: any[]) => Promise<void>>()
const teardown = jest.fn<(...args: any[]) => Promise<void>>()
const finalize = jest.fn(async (..._args: any[]) => {})
jest.unstable_mockModule('../src/parts/PrepareTestsOrAttach/PrepareTestsOrAttach.ts', () => ({
  state: { promise: undefined },
  prepareTestsAndAttach: prepare,
}))
jest.unstable_mockModule('../src/parts/GetTestToRun/GetTestsToRun.ts', () => ({
  getTestsToRun: async () =>
    ['first', 'second', 'third'].map((name) => ({
      absolutePath: '/test/src/' + name + '.ts',
      relativeDirname: 'src',
      relativePath: 'src/' + name + '.ts',
      dirent: name + '.ts',
    })),
}))
jest.unstable_mockModule('../src/parts/GetPrettyError/GetPrettyError.ts', () => ({ getPrettyError: async (error: Error) => error.message }))
jest.unstable_mockModule('../src/parts/TestWorkerSetupTest/TestWorkerSetupTest.ts', () => ({ testWorkerSetupTest: setup }))
jest.unstable_mockModule('../src/parts/TestWorkerRunTests/TestWorkerRunTests.ts', () => ({ testWorkerRunTests: run }))
jest.unstable_mockModule('../src/parts/TestWorkerTeardownTest/TestWorkerTearDownTest.ts', () => ({ testWorkerTearDownTest: teardown }))
jest.unstable_mockModule('../src/parts/VideoRecording/VideoRecording.ts', () => ({ finalize, addChapter: async () => {} }))
const { runTestsWithCallback } = await import('../src/parts/RunTestsWithCallback/RunTestsWithCallback.ts')
const options = () => ({
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
  restartBetween: false,
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
  workers.length = 0
  setup.mockReset().mockResolvedValue({ skipped: false, wasOriginallySkipped: false, error: null })
  run.mockReset().mockResolvedValue(undefined)
  teardown.mockReset().mockResolvedValue(undefined)
})

test.each(['setup', 'run', 'teardown'])('restarts the app after a %s failure while retaining the failure result', async (stage) => {
  const error = new Error('original failure')
  if (stage === 'setup') setup.mockResolvedValueOnce({ skipped: false, wasOriginallySkipped: false, error })
  if (stage === 'run') run.mockRejectedValueOnce(error)
  if (stage === 'teardown') teardown.mockRejectedValueOnce(error)
  const result = await runTestsWithCallback(options())
  expect(result).toMatchObject({ failed: 1, passed: 2 })
  expect(prepare).toHaveBeenCalledTimes(2)
  expect(setup.mock.calls.map((call) => call[0])).toEqual([workers[0].testWorkerRpc, workers[1].testWorkerRpc, workers[1].testWorkerRpc])
  expect(workers[0].initializationWorkerRpc.dispose).toHaveBeenCalledTimes(1)
})

test('also recovers from an intentionally skipped scenario forced to run', async () => {
  setup.mockResolvedValueOnce({ skipped: false, wasOriginallySkipped: true, error: new Error('skipped scenario setup failed') })
  const result = await runTestsWithCallback(options())
  expect(result).toMatchObject({ failed: 0, skippedFailed: 1, passed: 2 })
  expect(prepare).toHaveBeenCalledTimes(2)
})

test('successful scenarios keep sharing the app', async () => {
  const result = await runTestsWithCallback(options())
  expect(result).toMatchObject({ failed: 0, passed: 3 })
  expect(prepare).toHaveBeenCalledTimes(1)
})

test('finalizes and archives the failed session video before recovery', async () => {
  run.mockRejectedValueOnce(new Error('scenario failed'))
  await runTestsWithCallback({ ...options(), recordVideo: true })
  expect(finalize.mock.calls).toEqual([[workers[0].videoRpc, 'part-1'], [workers[1].videoRpc]])
  expect(finalize.mock.invocationCallOrder[0]).toBeLessThan(workers[0].videoRpc.dispose.mock.invocationCallOrder[0])
})

test('an ordinary skipped scenario does not restart the app', async () => {
  setup.mockResolvedValueOnce({ skipped: true, wasOriginallySkipped: true, error: null })
  const result = await runTestsWithCallback(options())
  expect(result).toMatchObject({ failed: 0, skipped: 1, passed: 2 })
  expect(prepare).toHaveBeenCalledTimes(1)
})
