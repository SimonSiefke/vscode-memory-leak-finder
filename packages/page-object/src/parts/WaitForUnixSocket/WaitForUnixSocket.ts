import { createConnection } from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'

const canConnect = async (socketPath: string): Promise<boolean> => {
  const socket = createConnection(socketPath)
  const { promise, resolve } = Promise.withResolvers<boolean>()
  const finish = (connected: boolean) => {
    socket.removeAllListeners()
    if (connected) {
      socket.end()
    } else {
      socket.destroy()
    }
    resolve(connected)
  }
  socket.once('connect', () => finish(true))
  socket.once('error', () => finish(false))
  socket.setTimeout(500, () => finish(false))
  return promise
}

export const waitForUnixSocket = async ({
  getOutput,
  hasExited,
  socketPath,
}: {
  readonly getOutput: () => string
  readonly hasExited: () => boolean
  readonly socketPath: string
}): Promise<void> => {
  for (let attempt = 0; attempt < 200; attempt++) {
    if (hasExited()) {
      throw new Error(`External runtime exited before Unix socket was ready\n${getOutput()}`)
    }
    if (await canConnect(socketPath)) {
      return
    }
    await delay(50)
  }
  throw new Error(`Timed out waiting for Unix socket ${socketPath}\n${getOutput()}`)
}
