import type * as ParseArgv from '../ParseArgv/ParseArgv.ts'
import * as SpecialStdin from '../SpecialStdin/SpecialStdin.ts'
import * as StartRunning from '../StartRunning/StartRunning.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as WatchUsage from '../WatchUsage/WatchUsage.ts'

export const initialStart = async (options: ReturnType<typeof ParseArgv.parseArgv> & { isGithubActions: boolean }): Promise<void> => {
  if (options.watch) {
    await SpecialStdin.start()
  }
  if (options.watch && !options.filter) {
    await Stdout.write(await WatchUsage.print())
    return
  }
  await StartRunning.startRunning({
    arch: options.arch,
    bisect: options.bisect,
    checkLeaks: options.checkLeaks,
    clearExtensions: options.clearExtensions,
    color: options.color,
    commit: options.commit,
    compressVideo: options.compressVideo,
    continueValue: options.continueValue,
    cwd: options.cwd,
    enableExtensions: options.enableExtensions,
    enableProxy: options.enableProxy,
    filterValue: options.filter,
    headlessMode: options.headless,
    ide: options.ide,
    ideVersion: options.ideVersion,
    insidersCommit: options.insidersCommit,
    inspectExtensions: options.inspectExtensions,
    inspectExtensionsPort: options.inspectExtensionsPort,
    inspectPtyHost: options.inspectPtyHost,
    inspectPtyHostPort: options.inspectPtyHostPort,
    inspectSharedProcess: options.inspectSharedProcess,
    inspectSharedProcessPort: options.inspectSharedProcessPort,
    isGithubActions: options.isGithubActions,
    isWindows: options.isWindows,
    measure: options.measure,
    measureAfter: options.measureAfter,
    measureNode: options.measureNode,
    platform: options.platform,
    recordVideo: options.recordVideo,
    restartBetween: options.restartBetween,
    runMode: options.runMode,
    runs: options.runs,
    runSkippedTestsAnyway: options.runSkippedTestsAnyway,
    screencastQuality: options.screencastQuality,
    setupOnly: options.setupOnly,
    timeoutBetween: options.timeoutBetween,
    timeouts: options.timeouts,
    updateUrl: options.updateUrl,
    useProxyMock: options.useProxyMock,
    vscodePath: options.vscodePath,
    vscodeVersion: options.vscodeVersion,
    workers: options.workers,
  })
}
