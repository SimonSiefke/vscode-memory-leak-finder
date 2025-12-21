export const kill = async (pid: number, signal?: NodeJS.Signals | number): Promise<void> => {
  process.kill(pid)
}

export const exit = (code?: number): never => {
  process.exit(code)
}

export const on = (event: string, listener: (...args: any[]) => void): NodeJS.Process => {
  return process.on(event as any, listener)
}
