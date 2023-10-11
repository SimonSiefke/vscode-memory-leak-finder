import * as NodeProcess from 'node:process'

export const exit = (exitCode) => {
  NodeProcess.exit(exitCode)
}

export const stdin = NodeProcess.stdin

export const stdout = NodeProcess.stdout

export const stderr = NodeProcess.stdout

export const kill = (pid) => {
  NodeProcess.kill(pid)
}

export const on = (event, listener) => {
  NodeProcess.on(event, listener)
}
