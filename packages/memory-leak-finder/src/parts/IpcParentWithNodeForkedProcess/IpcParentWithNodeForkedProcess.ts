import { fork } from 'node:child_process'

export const create = async ({ execArgv = [], url }) => {
  const childProcess = fork(url, ['--ipc-type=forked-process'], {
    execArgv,
    stdio: 'pipe',
  })
  childProcess.stdout?.pipe(process.stdout)
  childProcess.stderr?.pipe(process.stderr)
  return childProcess
}

export const wrap = (childProcess) => {
  return {
    childProcess,
    dispose() {
      this.childProcess.kill()
    },
    on(event, listener) {
      switch (event) {
        case 'exit':
          this.childProcess.on('exit', listener)
          break
        case 'message':
          this.childProcess.on('message', listener)
          break
        default:
          throw new Error('unexpected listener')
      }
    },
    once(event, listener) {
      switch (event) {
        case 'error':
          this.childProcess.once('error', listener)
          break
        case 'exit':
          this.childProcess.once('exit', listener)
          break
        default:
          throw new Error('unexpected listener')
      }
    },
    set onmessage(listener) {
      this.childProcess.on('message', listener)
    },
    send(message) {
      this.childProcess.send(message)
    },
    stderr: childProcess.stderr,
    stdout: childProcess.stdout,
  }
}
