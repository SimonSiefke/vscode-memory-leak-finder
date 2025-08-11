import * as Signal from '../Signal/Signal.ts'

export const killProcess = (pid) => {
  process.kill(pid, Signal.SIGKILL)
}
