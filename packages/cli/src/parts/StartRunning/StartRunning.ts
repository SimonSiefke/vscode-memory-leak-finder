import type { StartRunningOptions } from './StartRunningOptions.ts'
import * as AnsiEscapes from '../AnsiEscapes/AnsiEscapes.ts'
import * as RunTest from '../RunTest/RunTest.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'
import * as HandleTestsFinished from '../HandleTestsFinished/HandleTestsFinished.ts'
import * as HandleTestsUnexpectedError from '../HandleTestsUnexpectedError/HandleTestsUnexpectedError.ts'

export const startRunning = async (options: StartRunningOptions): Promise<void> => {
  const {
    filterValue,
    headlessMode,
    color,
    checkLeaks,
    runSkippedTestsAnyway,
    recordVideo,
    cwd,
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
    setupOnly,
    workers,
    isWindows,
    continueValue,
    inspectSharedProcess,
    inspectExtensions,
    inspectPtyHost,
    enableExtensions,
    inspectPtyHostPort,
    inspectSharedProcessPort,
    inspectExtensionsPort,
    enableProxy,
    useProxyMock,
  } = options
  const clear = await AnsiEscapes.clear(isWindows)
  await Stdout.write(clear)
  const rpc = await RunTest.prepare()
  const result = await rpc.invoke(TestWorkerCommandType.RunTests, {
    root: cwd,
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
    setupOnly,
    workers,
    continueValue,
    inspectSharedProcess,
    inspectExtensions,
    inspectPtyHost,
    enableExtensions,
    inspectPtyHostPort,
    inspectSharedProcessPort,
    inspectExtensionsPort,
    enableProxy,
    useProxyMock,
  })
  if (result.type === 'success') {
    await HandleTestsFinished.handleTestsFinished(
      result.passed,
      result.failed,
      result.skipped,
      result.skippedFailed,
      result.leaked,
      result.total,
      result.duration,
      result.filterValue,
    )
  } else {
    await HandleTestsUnexpectedError.handleTestsUnexpectedError(result.prettyError)
  }
}
