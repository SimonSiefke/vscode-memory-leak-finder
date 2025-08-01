import * as GetOptions from '../GetOptions/GetOptions.js'
import * as InitialStart from '../InitialStart/InitialStart.js'
import * as StdinDataState from '../StdinDataState/StdinDataState.js'

export const run = async () => {
  const options = GetOptions.getOptions()
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
  })
  return InitialStart.initialStart(options)
}
