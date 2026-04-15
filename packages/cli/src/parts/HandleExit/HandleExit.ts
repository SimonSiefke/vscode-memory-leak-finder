import * as Delay from '../Delay/Delay.ts'
import * as KillWorkers from '../KillWorkers/KillWorkers.ts'
import * as StdinDataState from '../StdinDataState/StdinDataState.ts'
import { stopSpecialStdin } from '../StopSpecialStdin/StopSpecialStdin.ts'

const MacosShutdownDelay = 5_000

export const handleExit = async (): Promise<void> => {
  const state = StdinDataState.getState()
  if (state.platform === 'darwin') {
    await Delay.delay(MacosShutdownDelay)
  }
  await stopSpecialStdin()
  await KillWorkers.killWorkers()
}
