const kill = async (pid, signal) => {
  process.kill(pid)
}

export const exit = (code) => {
  process.exit(code)
}

const on = (event, listener) => {
  process.on(event, listener)
}
