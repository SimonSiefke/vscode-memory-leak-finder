import type { RunTestsOptions } from '../RunTestsOptions/RunTestsOptions.ts'
import type { RunTestsResult } from '../RunTestsResult/RunTestsResult.ts'
import * as CliProcess from '../CliProcess/CliProcess.ts'
import * as Disposables from '../Disposables/Disposables.ts'
import * as FetchAllInsidersVersions from '../FetchAllInsidersVersions/FetchAllInsidersVersions.ts'
import * as PerformBisect from '../PerformBisect/PerformBisect.ts'
import * as RunTestsWithCallback from '../RunTestsWithCallback/RunTestsWithCallback.ts'

const callback = async (method, ...params) => {
  await CliProcess.invoke(method, ...params)
}

export const runTests = async ({
  bisect,
  checkLeaks,
  color,
  commit,
  continueValue,
  cwd,
  enableExtensions,
  enableProxy,
  filterValue,
  headlessMode,
  ide,
  ideVersion,
  insidersCommit: insidersCommitInput,
  inspectExtensions,
  inspectExtensionsPort,
  inspectPtyHost,
  inspectPtyHostPort,
  inspectSharedProcess,
  inspectSharedProcessPort,
  measure,
  measureAfter,
  measureNode,
  recordVideo,
  restartBetween,
  root,
  runMode,
  runs,
  runSkippedTestsAnyway,
  screencastQuality,
  setupOnly,
  timeoutBetween,
  timeouts,
  useProxyMock,
  vscodePath,
  vscodeVersion,
}: RunTestsOptions): Promise<RunTestsResult> => {
  let insidersCommit = insidersCommitInput
  if (insidersCommit === 'today') {
    const versions = await FetchAllInsidersVersions.fetchAllInsidersVersions()
    if (versions.length === 0) {
      throw new Error('No insiders versions found')
    }
    insidersCommit = versions[0].commit
  }
  if (bisect) {
    if (!checkLeaks) {
      throw new Error('--bisect requires --check-leaks to be enabled')
    }
    const options: RunTestsOptions = {
      bisect,
      checkLeaks,
      color,
      commit,
      continueValue,
      cwd,
      enableExtensions,
      enableProxy,
      filterValue,
      headlessMode,
      ide,
      ideVersion,
      insidersCommit,
      inspectExtensions,
      inspectExtensionsPort,
      inspectPtyHost,
      inspectPtyHostPort,
      inspectSharedProcess,
      inspectSharedProcessPort,
      measure,
      measureAfter,
      measureNode,
      recordVideo,
      restartBetween,
      root,
      runMode,
      runs,
      runSkippedTestsAnyway,
      screencastQuality,
      setupOnly,
      timeoutBetween,
      timeouts,
      useProxyMock,
      vscodePath,
      vscodeVersion,
    }
    return PerformBisect.performBisect(options)
  }

  return RunTestsWithCallback.runTestsWithCallback({
    addDisposable: Disposables.add,
    callback,
    checkLeaks,
    clearDisposables: Disposables.disposeAll,
    color,
    commit,
    continueValue,
    cwd,
    enableExtensions,
    enableProxy,
    filterValue,
    headlessMode,
    ide,
    ideVersion,
    insidersCommit,
    inspectExtensions,
    inspectExtensionsPort,
    inspectPtyHost,
    inspectPtyHostPort,
    inspectSharedProcess,
    inspectSharedProcessPort,
    measure,
    measureAfter,
    measureNode,
    recordVideo,
    restartBetween,
    root,
    runMode,
    runs,
    runSkippedTestsAnyway,
    screencastQuality,
    setupOnly,
    timeoutBetween,
    timeouts,
    useProxyMock,
    vscodePath,
    vscodeVersion,
  })
}
