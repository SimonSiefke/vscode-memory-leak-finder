import type { RunTestsOptions } from '../RunTestsOptions/RunTestsOptions.ts'
import * as CliProcess from '../CliProcess/CliProcess.ts'
import * as RunTestsWithCallback from '../RunTestsWithCallback/RunTestsWithCallback.ts'
import * as Disposables from '../Disposables/Disposables.ts'
import type { RunTestsResult } from '../RunTestsResult/RunTestsResult.ts'
import * as PerformBisect from '../PerformBisect/PerformBisect.ts'

const callback = async (method, ...params) => {
  await CliProcess.invoke(method, ...params)
}

export const runTests = async (options: RunTestsOptions): Promise<RunTestsResult> => {
  if (options.bisect) {
    if (!options.checkLeaks) {
      throw new Error('--bisect requires --check-leaks to be enabled')
    }
    return PerformBisect.performBisect(options)
  }

  return RunTestsWithCallback.runTestsWithCallback({
    root: options.root,
    cwd: options.cwd,
    filterValue: options.filterValue,
    headlessMode: options.headlessMode,
    color: options.color,
    checkLeaks: options.checkLeaks,
    runSkippedTestsAnyway: options.runSkippedTestsAnyway,
    recordVideo: options.recordVideo,
    runs: options.runs,
    measure: options.measure,
    measureAfter: options.measureAfter,
    measureNode: options.measureNode,
    timeouts: options.timeouts,
    timeoutBetween: options.timeoutBetween,
    restartBetween: options.restartBetween,
    runMode: options.runMode,
    ide: options.ide,
    ideVersion: options.ideVersion,
    vscodePath: options.vscodePath,
    vscodeVersion: options.vscodeVersion,
    commit: options.commit,
    setupOnly: options.setupOnly,
    inspectSharedProcess: options.inspectSharedProcess,
    inspectExtensions: options.inspectExtensions,
    inspectPtyHost: options.inspectPtyHost,
    enableExtensions: options.enableExtensions,
    continueValue: options.continueValue,
    inspectPtyHostPort: options.inspectPtyHostPort,
    inspectSharedProcessPort: options.inspectSharedProcessPort,
    inspectExtensionsPort: options.inspectExtensionsPort,
    enableProxy: options.enableProxy,
    useProxyMock: options.useProxyMock,
    callback,
    addDisposable: Disposables.add,
    clearDisposables: Disposables.disposeAll,
  })
}
