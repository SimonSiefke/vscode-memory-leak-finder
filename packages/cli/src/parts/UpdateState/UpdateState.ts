import * as HandleExit from '../HandleExit/HandleExit.ts'
import * as KillWorkers from '../KillWorkers/KillWorkers.ts'
import * as ModeType from '../ModeType/ModeType.ts'
import * as PreviousFilters from '../PreviousFilters/PreviousFilters.ts'
import * as StartRunning from '../StartRunning/StartRunning.ts'
import * as StdinDataState from '../StdinDataState/StdinDataState.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as VsCodeVersion from '../VsCodeVersion/VsCodeVersion.ts'

export const updateState = async (newState: any): Promise<void> => {
  const state = StdinDataState.getState()
  if (newState === state) {
    return
  }
  if (newState.stdout && newState.stdout.length > 0) {
    await Stdout.write(newState.stdout.join(''))
  }
  if (newState.previousFilters.length > 0) {
    await PreviousFilters.addAll(newState.previousFilters)
  }
  if (newState.mode === ModeType.Exit || newState.mode === ModeType.FinishedRunning) {
    if (newState.exitCode) {
      process.exitCode = newState.exitCode
    }
    return HandleExit.handleExit()
  }
  StdinDataState.setState({ ...newState, previousFilters: [], stdout: [] })
  if (state.mode !== ModeType.Running && newState.mode === ModeType.Running) {
    await StartRunning.startRunning({
      arch: state.arch,
      bisect: state.bisect,
      checkLeaks: state.checkLeaks,
      clearExtensions: state.clearExtensions,
      color: true,
      commit: '',
      compressVideo: state.compressVideo,
      continueValue: state.continueValue,
      cwd: state.cwd,
      enableExtensions: state.enableExtensions,
      enableProxy: state.enableProxy,
      filterValue: state.value,
      headlessMode: state.headless,
      ide: state.ide,
      ideVersion: state.ideVersion,
      insidersCommit: state.insidersCommit,
      inspectExtensions: state.inspectExtensions,
      inspectExtensionsPort: state.inspectExtensionsPort,
      inspectPtyHost: state.inspectPtyHost,
      inspectPtyHostPort: state.inspectPtyHostPort,
      inspectSharedProcess: state.inspectSharedProcess,
      inspectSharedProcessPort: state.inspectSharedProcessPort,
      isGithubActions: state.isGithubActions,
      isWindows: state.isWindows,
      login: false,
      measure: state.measure,
      measureAfter: state.measureAfter,
      measureNode: false,
      platform: state.platform,
      recordVideo: state.recordVideo,
      restartBetween: state.restartBetween,
      runMode: state.runMode,
      runs: state.runs,
      runSkippedTestsAnyway: state.runSkippedTestsAnyway,
      screencastQuality: state.screencastQuality,
      setupOnly: false,
      timeoutBetween: state.timeoutBetween,
      timeouts: state.timeouts,
      updateUrl: 'https://update.code.visualstudio.com',
      useProxyMock: state.useProxyMock,
      vscodePath: '',
      vscodeVersion: VsCodeVersion.vscodeVersion,
      workers: state.workers,
    })
  }
  if (newState.mode === ModeType.Interrupted) {
    await KillWorkers.killWorkers()
  }
}
