import * as Signal from '../Signal/Signal.ts'

export const killProcess = (pid: number): void => {
  process.kill(pid, Signal.SIGKILL)
}
