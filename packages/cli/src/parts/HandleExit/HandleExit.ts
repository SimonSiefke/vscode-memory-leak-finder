import * as KillWorkers from '../KillWorkers/KillWorkers.ts'
import { stopSpecialStdin } from '../StopSpecialStdin/StopSpecialStdin.ts'

export const handleExit = async (): Promise<void> => {
  await stopSpecialStdin()
  await KillWorkers.killWorkers()
}
