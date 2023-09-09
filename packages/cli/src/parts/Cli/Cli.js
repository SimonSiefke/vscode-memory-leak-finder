import * as GetOptions from '../GetOptions/GetOptions.js'
import * as SpecialStdin from '../SpecialStdin/SpecialStdin.js'
import * as StartRunning from '../StartRunning/StartRunning.js'
import * as StdinDataState from '../StdinDataState/StdinDataState.js'
import * as Stdout from '../Stdout/Stdout.js'
import * as WatchUsage from '../WatchUsage/WatchUsage.js'

export const run = async () => {
  const options = GetOptions.getOptions()
  StdinDataState.setState({
    ...StdinDataState.getState(),
    watch: options.watch,
    checkLeaks: options.checkLeaks,
    runs: options.runs,
  })
  if (options.watch) {
    SpecialStdin.start()
    Stdout.write(WatchUsage.print())
  } else {
    await StartRunning.startRunning('', options.headless, options.color, options.checkLeaks, options.recordVideo, options.runs)
  }
}
