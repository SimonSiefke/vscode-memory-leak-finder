import * as CommandMap from '../CommandMap/CommandMap.ts'
import * as CommandMapRef from '../CommandMapRef/CommandMapRef.ts'
import * as InitialStart from '../InitialStart/InitialStart.ts'
import * as IsWindows from '../IsWindows/IsWindows.ts'
import * as ParseArgv from '../ParseArgv/ParseArgv.ts'
import * as StdinDataState from '../StdinDataState/StdinDataState.ts'
import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const run = async (platform: string, argv: readonly string[], env: NodeJS.ProcessEnv): Promise<void> => {
  await StdoutWorker.initialize()
  Object.assign(CommandMapRef.commandMapRef, CommandMap.commandMap)
  const options = ParseArgv.parseArgv(argv)

  // Parse isGithubActions once at startup
  const isGithubActions = Boolean(env.GITHUB_ACTIONS)
  const isWindows = IsWindows.isWindows(platform)

  StdinDataState.setState({
    ...StdinDataState.getState(),
    checkLeaks: options.checkLeaks,
    runSkippedTestsAnyway: options.runSkippedTestsAnyway,
    commit: options.commit,
    cwd: options.cwd,
    headless: options.headless,
    ide: options.ide,
    ideVersion: options.ideVersion,
    isGithubActions,
    isWindows,
    measure: options.measure,
    measureAfter: options.measureAfter,
    measureNode: options.measureNode,
    recordVideo: options.recordVideo,
    restartBetween: options.restartBetween,
    runMode: options.runMode,
    runs: options.runs,
    setupOnly: options.setupOnly,
    timeoutBetween: options.timeoutBetween,
    timeouts: options.timeouts,
    value: options.filter,
    vscodePath: options.vscodePath,
    watch: options.watch,
    workers: options.workers,
    shouldContinue: options.shouldContinue,
  })
  return InitialStart.initialStart(options)
}
