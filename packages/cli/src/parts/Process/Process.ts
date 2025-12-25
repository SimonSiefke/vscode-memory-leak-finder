import * as NodeProcess from 'node:process'

export const exit = (exitCode: number): void => {
  NodeProcess.exit(exitCode)
}

export const { stdin } = NodeProcess

export const { stdout } = NodeProcess

export const stderr = NodeProcess.stdout

export const kill = (pid: number): void => {
  NodeProcess.kill(pid)
}

export const on = (event: string, listener: (...args: unknown[]) => void): void => {
  NodeProcess.on(event, listener)
}
