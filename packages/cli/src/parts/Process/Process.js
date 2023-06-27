export const exit = (exitCode) => {
  process.exit(exitCode)
}

export const stdin = process.stdin

export const stdout = process.stdout

export const stderr = process.stdout

export const kill = (pid) => {
  process.kill(pid)
}

export const on = (event, listener) => {
  process.on(event, listener)
}
