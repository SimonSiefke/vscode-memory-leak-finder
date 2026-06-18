import { beforeEach, expect, jest, test } from '@jest/globals'

const mockPrepareTestsAndAttach = jest.fn(async () => {
  throw new Error('prepareTestsAndAttach should not be called for setup-only')
})
const mockSetupOnly = jest.fn(async () => undefined)

jest.unstable_mockModule('../src/parts/PrepareTestsOrAttach/PrepareTestsOrAttach.ts', () => ({
  prepareTestsAndAttach: mockPrepareTestsAndAttach,
}))

jest.unstable_mockModule('../src/parts/SetupOnly/SetupOnly.ts', () => ({
  setupOnly: mockSetupOnly,
}))

const { runTestsWithCallback } = await import('../src/parts/RunTestsWithCallback/RunTestsWithCallback.ts')

beforeEach(() => {
  jest.clearAllMocks()
})

test('runTestsWithCallback - setupOnly skips launching and attaching to the app', async () => {
  const result = await runTestsWithCallback({
    addDisposable: () => {},
    allowCopilotAuthInCi: false,
    arch: 'x64',
    bailOnFailure: false,
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
    runs: 1,
    runSkippedTestsAnyway: false,
    screencastQuality: 100,
    setupOnly: true,
    timeoutBetween: 0,
    timeouts: false,
    trackFunctions: false,
    updateUrl: '',
    useProxyMock: false,
    vscodePath: '',
    vscodeVersion: '1.0.0',
  })

  expect(result).toEqual({
    duration: 0,
    failed: 0,
    filterValue: '',
    leaked: 0,
    passed: 0,
    skipped: 0,
    skippedFailed: 0,
    total: 0,
    type: 'success',
  })
  expect(mockPrepareTestsAndAttach.mock.calls).toEqual([])
  expect(mockSetupOnly.mock.calls).toEqual([
    [
      {
        arch: 'x64',
        clearExtensions: false,
        commit: 'abc123',
        cwd: '/test-cwd',
        downloadUserDataZipFileToken: '',
        downloadUserDataZipFileUrl: '',
        enableExtensions: false,
        enableProxy: false,
        ide: 'vscode',
        insidersCommit: '',
        inspectExtensions: false,
        inspectExtensionsPort: 0,
        inspectPtyHost: false,
        inspectPtyHostPort: 0,
        inspectSharedProcess: false,
        inspectSharedProcessPort: 0,
        platform: 'linux',
        updateUrl: '',
        useProxyMock: false,
        vscodePath: '',
        vscodeVersion: '1.0.0',
      },
    ],
  ])
})
