import * as KillWorkers from '../KillWorkers/KillWorkers.js'
import * as SpecialStdin from '../SpecialStdin/SpecialStdin.js'

export const handleExit = async () => {
  await SpecialStdin.stop()
  KillWorkers.killWorkers()
}
