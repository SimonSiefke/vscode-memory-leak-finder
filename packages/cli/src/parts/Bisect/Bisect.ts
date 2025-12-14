import * as RunTest from '../RunTest/RunTest.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import type { StartRunningOptions } from '../StartRunning/StartRunningOptions.ts'

export interface BisectResult {
  type: 'success' | 'failed-test' | 'not-found'
  commit?: string
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
    const result = await rpc.invoke(TestWorkerCommandType.Bisect, {
      root: options.cwd,
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
      continueValue: options.continueValue,
      inspectSharedProcess: options.inspectSharedProcess,
      inspectExtensions: options.inspectExtensions,
      inspectPtyHost: options.inspectPtyHost,
      enableExtensions: options.enableExtensions,
      inspectPtyHostPort: options.inspectPtyHostPort,
      inspectSharedProcessPort: options.inspectSharedProcessPort,
      inspectExtensionsPort: options.inspectExtensionsPort,
      enableProxy: options.enableProxy,
      useProxyMock: options.useProxyMock,
    })

    if (result.type === 'success') {
      await Stdout.write(`\nBisect completed successfully!\n`)
      await Stdout.write(`Memory leak regression introduced in commit: ${result.commit}\n`)
    } else if (result.type === 'failed-test') {
      await Stdout.write(`\nBisect failed due to failed test.\n`)
    } else {
      await Stdout.write(`\nBisect completed but no leaking commit found in the tested range.\n`)
    }

    return result
  } catch (error) {
    await Stdout.write(`Bisect failed: ${error}\n`)
    return {
      type: 'failed-test',
    }
  } finally {
    await rpc.dispose()
  }
}
