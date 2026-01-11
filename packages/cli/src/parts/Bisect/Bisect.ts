import type { StartRunningOptions } from '../StartRunning/StartRunningOptions.ts'
import * as RunTest from '../RunTest/RunTest.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'

export interface BisectResult {
  readonly commit?: string
  readonly type: 'success' | 'failed-test' | 'not-found'
}

export const bisect = async (options: StartRunningOptions): Promise<BisectResult> => {
  if (!options.checkLeaks) {
    await Stdout.write('Error: --bisect requires --check-leaks to be enabled\n')
    process.exit(1)
  }

  await Stdout.write('Fetching commits from VS Code API...\n')
  await Stdout.write('Starting bisect...\n')

  const rpc = await RunTest.prepare()

  try {
    const result = await rpc.invoke(TestWorkerCommandType.RunTests, {
      bisect: true,
      checkLeaks: options.checkLeaks,
      color: options.color,
      commit: options.commit,
      compressVideo: options.compressVideo,
      continueValue: options.continueValue,
      cwd: options.cwd,
      enableExtensions: options.enableExtensions,
      enableProxy: options.enableProxy,
      filterValue: options.filterValue,
      headlessMode: options.headlessMode,
      ide: options.ide,
      ideVersion: options.ideVersion,
      inspectExtensions: options.inspectExtensions,
      inspectExtensionsPort: options.inspectExtensionsPort,
      inspectPtyHost: options.inspectPtyHost,
      inspectPtyHostPort: options.inspectPtyHostPort,
      inspectSharedProcess: options.inspectSharedProcess,
      inspectSharedProcessPort: options.inspectSharedProcessPort,
      login: options.login,
      measure: options.measure,
      measureAfter: options.measureAfter,
      measureNode: options.measureNode,
      recordVideo: options.recordVideo,
      restartBetween: options.restartBetween,
      root: options.cwd,
      runMode: options.runMode,
      runs: options.runs,
      runSkippedTestsAnyway: options.runSkippedTestsAnyway,
      setupOnly: options.setupOnly,
      timeoutBetween: options.timeoutBetween,
      timeouts: options.timeouts,
      updateUrl: options.updateUrl,
      useProxyMock: options.useProxyMock,
      vscodePath: options.vscodePath,
      vscodeVersion: options.vscodeVersion,
    })

    // Type guard to check if result is a BisectResult (has 'commit' field but not 'passed')
    if (result.type === 'success' && 'commit' in result && !('passed' in result)) {
      await Stdout.write(`\nBisect completed successfully!\n`)
      await Stdout.write(`Memory leak regression introduced in commit: ${result.commit}\n`)
      return result as BisectResult
    } else if (result.type === 'failed-test') {
      await Stdout.write(`\nBisect failed due to failed test.\n`)
      return result as BisectResult
    } else if (result.type === 'not-found') {
      await Stdout.write(`\nBisect completed but no leaking commit found in the tested range.\n`)
      return result as BisectResult
    } else {
      // This shouldn't happen, but handle regular test results
      await Stdout.write(`\nUnexpected result type from bisect.\n`)
      return {
        type: 'failed-test',
      }
    }
  } catch (error) {
    await Stdout.write(`Bisect failed: ${error}\n`)
    return {
      type: 'failed-test',
    }
  } finally {
    await rpc.dispose()
  }
}
