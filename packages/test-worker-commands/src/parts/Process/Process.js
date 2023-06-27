export const kill = async (pid, signal) => {
  process.kill(pid)
}

export const exit = (code) => {
  process.exit(code)
}

export const on = (event, listener) => {
  process.on(event, listener)
}

export const env = process.env
export const chdir = process.chdir
