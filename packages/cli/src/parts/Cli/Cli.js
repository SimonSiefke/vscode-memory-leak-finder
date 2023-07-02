import * as SpecialStdin from '../SpecialStdin/SpecialStdin.js'
import * as Stdout from '../Stdout/Stdout.js'
import * as WatchUsage from '../WatchUsage/WatchUsage.js'
import * as ParseArgv from '../ParseArgv/ParseArgv.js'
import * as Process from '../Process/Process.js'
import * as StartRunning from '../StartRunning/StartRunning.js'
import * as StdinDataState from '../StdinDataState/StdinDataState.js'

export const run = async () => {
  const options = ParseArgv.parseArgv(Process.argv)
  StdinDataState.setState({
    ...StdinDataState.getState(),
    watch: options.watch,
  })
  if (options.watch) {
    SpecialStdin.start()
    Stdout.write(WatchUsage.print())
  } else {
    await StartRunning.startRunning('', false, true)
  }
}
