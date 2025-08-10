import * as CommandMap from '../CommandMap/CommandMap.ts'
import * as CommandMapRef from '../CommandMapRef/CommandMapRef.ts'
import * as InitialStart from '../InitialStart/InitialStart.ts'
import * as ParseArgv from '../ParseArgv/ParseArgv.ts'
import * as StdinDataState from '../StdinDataState/StdinDataState.ts'
import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const run = async (argv: readonly string[], env: NodeJS.ProcessEnv): Promise<void> => {
  await StdoutWorker.initialize()
  Object.assign(CommandMapRef.commandMapRef, CommandMap.commandMap)
  const options = ParseArgv.parseArgv(argv)

  // Parse isGithubActions once at startup
  const isGithubActions = Boolean(env.GITHUB_ACTIONS)

  StdinDataState.setState({
    ...StdinDataState.getState(),
    watch: options.watch,
    checkLeaks: options.checkLeaks,
    runs: options.runs,
    recordVideo: options.recordVideo,
    cwd: options.cwd,
    headless: options.headless,
    isGithubActions,
    measure: options.measure,
    value: options.filter,
    measureAfter: options.measureAfter,
    timeouts: options.timeouts,
    timeoutBetween: options.timeoutBetween,
    restartBetween: options.restartBetween,
    runMode: options.runMode,
    ide: options.ide,
    ideVersion: options.ideVersion,
    vscodePath: options.vscodePath,
    commit: options.commit,
    setupOnly: options.setupOnly,
    workers: options.workers,
  })
  return InitialStart.initialStart(options)
}
