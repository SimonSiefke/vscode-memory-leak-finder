import * as Argv from '../Argv/Argv.ts'
import * as InitialStart from '../InitialStart/InitialStart.ts'
import * as ParseArgv from '../ParseArgv/ParseArgv.ts'
import * as StdinDataState from '../StdinDataState/StdinDataState.ts'
import * as CommandMap from '../CommandMap/CommandMap.ts'
import * as CommandMapRef from '../CommandMapRef/CommandMapRef.ts'

export const run = async () => {
  Object.assign(CommandMapRef.commandMapRef, CommandMap.commandMap)
  const options = ParseArgv.parseArgv(Argv.argv)
  StdinDataState.setState({
    ...StdinDataState.getState(),
    watch: options.watch,
    checkLeaks: options.checkLeaks,
    runs: options.runs,
    recordVideo: options.recordVideo,
    cwd: options.cwd,
    headless: options.headless,
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
  })
  return InitialStart.initialStart(options)
}
