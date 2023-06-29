import * as SpecialStdin from '../SpecialStdin/SpecialStdin.js'
import * as Stdout from '../Stdout/Stdout.js'
import * as WatchUsage from '../WatchUsage/WatchUsage.js'

export const run = () => {
  SpecialStdin.start()
  Stdout.write(WatchUsage.print())
}
