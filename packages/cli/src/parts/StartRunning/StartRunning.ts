import * as AnsiEscapes from '../AnsiEscapes/AnsiEscapes.ts'
import * as HandleTestsFinished from '../HandleTestsFinished/HandleTestsFinished.ts'
import * as HandleTestsUnexpectedError from '../HandleTestsUnexpectedError/HandleTestsUnexpectedError.ts'
import * as RunTest from '../RunTest/RunTest.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'
<<<<<<< HEAD
import * as HandleTestsFinished from '../HandleTestsFinished/HandleTestsFinished.ts'
import * as HandleTestsUnexpectedError from '../HandleTestsUnexpectedError/HandleTestsUnexpectedError.ts'
import * as Bisect from '../Bisect/Bisect.ts'
=======
import type { StartRunningOptions } from './StartRunningOptions.ts'
>>>>>>> origin/main

export const startRunning = async (options: StartRunningOptions): Promise<void> => {
  if (options.bisect) {
    const result = await Bisect.bisect(options)
    if (result.type === 'success') {
      await Stdout.write(`\nBisect did find a matching commit introducing the regression: ${result.commit}\n`)
      process.exit(0)
    } else if (result.type === 'failed-test') {
      await Stdout.write(`\nBisect failed due to failed test.\n`)
      process.exit(1)
    } else {
      await Stdout.write(`\nBisect didn't find a matching commit introducing the regression.\n`)
      process.exit(1)
    }
    return
  }
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
    insidersCommit,
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
    bisect,
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
    insidersCommit,
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
    bisect,
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
