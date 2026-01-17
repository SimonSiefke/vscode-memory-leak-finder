import * as CommandMap from '../CommandMap/CommandMap.ts'
import * as CommandMapRef from '../CommandMapRef/CommandMapRef.ts'
import * as InitialStart from '../InitialStart/InitialStart.ts'
import * as IsWindows from '../IsWindows/IsWindows.ts'
import * as ParseArgv from '../ParseArgv/ParseArgv.ts'
import * as StdinDataState from '../StdinDataState/StdinDataState.ts'
import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const run = async (platform: string, arch: string, argv: readonly string[], env: NodeJS.ProcessEnv): Promise<void> => {
  await StdoutWorker.initialize()
  Object.assign(CommandMapRef.commandMapRef, CommandMap.commandMap)
  const options = ParseArgv.parseArgv(platform, arch, argv)

  // Parse isGithubActions once at startup
  const isGithubActions = Boolean(env.GITHUB_ACTIONS)
  const isWindows = IsWindows.isWindows(platform)

  StdinDataState.setState({
    ...StdinDataState.getState(),
    arch: options.arch,
    bisect: options.bisect,
    checkLeaks: options.checkLeaks,
    // @ts-ignore
    commit: options.commit,
    continueValue: options.continueValue,
    cwd: options.cwd,
    enableExtensions: options.enableExtensions,
    headless: options.headless,
    ide: options.ide,
    ideVersion: options.ideVersion,
    insidersCommit: options.insidersCommit,
    inspectExtensions: options.inspectExtensions,
    inspectExtensionsPort: options.inspectExtensionsPort,
    inspectPtyHost: options.inspectPtyHost,
    inspectPtyHostPort: options.inspectPtyHostPort,
    inspectSharedProcess: options.inspectSharedProcess,
    inspectSharedProcessPort: options.inspectSharedProcessPort,
    isGithubActions,
    isWindows,
    measure: options.measure,
    measureAfter: options.measureAfter,
    measureNode: options.measureNode,
    pageObjectPath: options.pageObjectPath,
    platform: options.platform,
    recordVideo: options.recordVideo,
    restartBetween: options.restartBetween,
    runMode: options.runMode,
    runs: options.runs,
    runSkippedTestsAnyway: options.runSkippedTestsAnyway,
    setupOnly: options.setupOnly,
    timeoutBetween: options.timeoutBetween,
    timeouts: options.timeouts,
    trackFunctions: options.trackFunctions,
    value: options.filter,
    vscodePath: options.vscodePath,
    vscodeVersion: options.vscodeVersion,
    watch: options.watch,
    workers: options.workers,
  })
  return InitialStart.initialStart({ ...options, isGithubActions } as ReturnType<typeof ParseArgv.parseArgv> & { isGithubActions: boolean })
}
