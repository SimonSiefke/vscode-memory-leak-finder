import * as KillWorkers from '../KillWorkers/KillWorkers.ts'
import * as SpecialStdin from '../SpecialStdin/SpecialStdin.ts'

export const handleExit = async () => {
  await SpecialStdin.stop()
  KillWorkers.killWorkers()
}
