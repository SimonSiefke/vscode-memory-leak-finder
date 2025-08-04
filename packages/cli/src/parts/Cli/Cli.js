import * as Argv from '../Argv/Argv.js'
import * as InitialStart from '../InitialStart/InitialStart.js'
import * as ParseArgv from '../ParseArgv/ParseArgv.js'
import * as StdinDataState from '../StdinDataState/StdinDataState.js'
import * as StdoutWorker from '../StdoutWorker/StdoutWorker.js'

export const run = async () => {
  await StdoutWorker.prepare()
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
