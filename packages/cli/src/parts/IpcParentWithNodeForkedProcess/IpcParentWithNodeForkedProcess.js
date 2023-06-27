import { fork } from 'node:child_process'

export const create = async ({ url }) => {
  const childProcess = fork(url, ['--ipc-type=forked-process'], {
    stdio: 'pipe',
  })
  childProcess.stdout?.pipe(process.stdout)
  childProcess.stderr?.pipe(process.stderr)
  return childProcess
}

export const wrap = (childProcess) => {
  return {
    childProcess,
    send(message) {
      this.childProcess.send(message)
    },
    set onmessage(listener) {
      this.childProcess.on('message', listener)
    },
    stdout: childProcess.stdout,
    stderr: childProcess.stderr,
    dispose() {
      this.childProcess.kill()
    },
    on(event, listener) {
      switch (event) {
        case 'exit':
          this.childProcess.on('exit', listener)
        default:
          throw new Error('unexpected listener')
      }
    },
    once(event, listener) {
      switch (event) {
        case 'exit':
          this.childProcess.once('exit', listener)
          break
        case 'error':
          this.childProcess.once('error', listener)
          break
        default:
          throw new Error('unexpected listener')
      }
    },
  }
}
