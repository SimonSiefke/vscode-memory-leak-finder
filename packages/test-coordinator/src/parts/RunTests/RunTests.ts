import type { RunTestsOptions } from '../RunTestsOptions/RunTestsOptions.ts'
import * as CliProcess from '../CliProcess/CliProcess.ts'
import * as RunTestsWithCallback from '../RunTestsWithCallback/RunTestsWithCallback.ts'
import * as Disposables from '../Disposables/Disposables.ts'
import type { RunTestsResult } from '../RunTestsResult/RunTestsResult.ts'
import * as PerformBisect from '../PerformBisect/PerformBisect.ts'

const callback = async (method, ...params) => {
  await CliProcess.invoke(method, ...params)
}

export const runTests = async ({
  root,
  cwd,
  filterValue,
  headlessMode,
  color,
  checkLeaks,
  runSkippedTestsAnyway,
  recordVideo,
  runs,
  measure,
  measureAfter,
  measureNode,
  timeouts,
  timeoutBetween,
  restartBetween,
  runMode,
  ide,
  ideVersion,
  vscodePath,
  vscodeVersion,
  commit,
  insidersCommit,
  setupOnly,
  inspectSharedProcess,
  inspectExtensions,
  inspectPtyHost,
  enableExtensions,
  continueValue,
  inspectPtyHostPort,
  inspectSharedProcessPort,
  inspectExtensionsPort,
  enableProxy,
  useProxyMock,
  bisect,
}: RunTestsOptions): Promise<RunTestsResult> => {
  if (bisect) {
    if (!checkLeaks) {
      throw new Error('--bisect requires --check-leaks to be enabled')
    }
    const options: RunTestsOptions = {
      root,
      cwd,
      filterValue,
      headlessMode,
      color,
      checkLeaks,
      runSkippedTestsAnyway,
      recordVideo,
      runs,
      measure,
      measureAfter,
      measureNode,
      timeouts,
      timeoutBetween,
      restartBetween,
      runMode,
      ide,
      ideVersion,
      vscodePath,
      vscodeVersion,
      commit,
      insidersCommit,
      setupOnly,
      inspectSharedProcess,
      inspectExtensions,
      inspectPtyHost,
      enableExtensions,
      continueValue,
      inspectPtyHostPort,
      inspectSharedProcessPort,
      inspectExtensionsPort,
      enableProxy,
      useProxyMock,
      bisect,
    }
    return PerformBisect.performBisect(options)
  }

  return RunTestsWithCallback.runTestsWithCallback({
    root,
    cwd,
    filterValue,
    headlessMode,
    color,
    checkLeaks,
    runSkippedTestsAnyway,
    recordVideo,
    runs,
    measure,
    measureAfter,
    measureNode,
    timeouts,
    timeoutBetween,
    restartBetween,
    runMode,
    ide,
    ideVersion,
    vscodePath,
    vscodeVersion,
    commit,
    insidersCommit,
    setupOnly,
    inspectSharedProcess,
    inspectExtensions,
    inspectPtyHost,
    enableExtensions,
    continueValue,
    inspectPtyHostPort,
    inspectSharedProcessPort,
    inspectExtensionsPort,
    enableProxy,
    useProxyMock,
    callback,
    addDisposable: Disposables.add,
    clearDisposables: Disposables.disposeAll,
  })
}
