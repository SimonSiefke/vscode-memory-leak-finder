import * as KillWorkers from '../KillWorkers/KillWorkers.js'
import * as SpecialStdin from '../SpecialStdin/SpecialStdin.js'

export const handleExit = async () => {
  SpecialStdin.stop()
  // TODO make exit synchronous and fast
  await KillWorkers.killWorkers()
}
