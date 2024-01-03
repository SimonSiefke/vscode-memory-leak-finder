import * as Signal from '../Signal/Signal.js'

export const killProcess = (pid) => {
  process.kill(pid, Signal.SIGKILL)
}
