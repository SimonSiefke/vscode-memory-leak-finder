import { expect, test } from '@jest/globals'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer, type Socket } from 'node:net'
import { createConnection } from '../src/parts/DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import { connectToDevtoolsWithJsonUrl } from '../src/parts/ConnectToDevtoolsWithJsonUrl/ConnectToDevtoolsWithJsonUrl.ts'

const getPort = async (): Promise<number> => {
  for (const port of [6667, 6668, 6669]) {
    const server = createServer()
    try {
      server.listen(port, '127.0.0.1')
      await once(server, 'listening')
      return port
    } catch (error) {
      if (error.code !== 'EADDRINUSE') throw error
    } finally {
      if (server.listening) await new Promise<void>((resolve) => server.close(() => resolve()))
    }
  }
  throw new Error('All inspector test ports are occupied')
}

test('connects to a Node inspector on a port restricted by Fetch', async () => {
  const port = await getPort()
  const child = spawn(process.execPath, [`--inspect=127.0.0.1:${port}`, '-e', 'setInterval(() => {}, 1000); console.log("ready")'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let rpc: Awaited<ReturnType<typeof connectToDevtoolsWithJsonUrl>> | undefined
  try {
    await once(child.stdout, 'data')
    rpc = await connectToDevtoolsWithJsonUrl(port)
    const response = await rpc.invoke('Runtime.evaluate', { expression: 'process.pid', returnByValue: true })
    expect(response.result.result.value).toBe(child.pid)
  } finally {
    await rpc?.dispose()
    if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit')
      child.kill()
      await exited
    }
  }
}, 15000)

test('releases a WebSocket connection when the inspector handshake times out', async () => {
  const sockets = new Set<Socket>()
  const server = createServer((socket) => sockets.add(socket))
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  try {
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('Expected a TCP address')
    await expect(createConnection(`ws://127.0.0.1:${address.port}`, { connectionTimeoutMs: 50 })).rejects.toThrow(
      'Failed to create websocket connection',
    )
  } finally {
    for (const socket of sockets) socket.destroy()
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
})
