import { expect, test } from '@jest/globals'
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { once } from 'node:events'
import { createServer } from 'node:net'
import { inspectChildProcess } from '../src/parts/InspectChildProcess/InspectChildProcess.ts'

const linuxTest = process.platform === 'linux' ? test : test.skip

const getPort = async (ports: number[]): Promise<number> => {
  for (const port of ports) {
    const server = createServer()
    try {
      server.listen(port, '127.0.0.1')
      await once(server, 'listening')
      const address = server.address()
      if (!address || typeof address === 'string') throw new Error('Expected a TCP address')
      return address.port
    } catch (error) {
      if (error.code !== 'EADDRINUSE') throw error
    } finally {
      if (server.listening) await new Promise<void>((resolve) => server.close(() => resolve()))
    }
  }
  throw new Error('All inspector test ports are occupied')
}

linuxTest.each([false, true])(
  'enables and verifies an owned Node child (Fetch-restricted port: %s), and rejects a different PID',
  async (restrictedPort) => {
    const port = await getPort(restrictedPort ? [6000, 6666, 10080] : [0])
    const name = `inspect-child-${randomUUID()}`
    const script = 'setInterval(() => {}, 1000); console.log("ready")'
    const child = spawn(process.execPath, [`--inspect-port=127.0.0.1:${port}`, '-e', script, name], { stdio: ['ignore', 'pipe', 'pipe'] })
    let other: ReturnType<typeof spawn> | undefined
    try {
      await once(child.stdout, 'data')
      const runtime = await inspectChildProcess(process.pid, name)
      expect(runtime).toMatchObject({ pid: child.pid, inspectPort: port, runtimeName: 'node' })
      expect(await inspectChildProcess(child.pid!, name)).toBeUndefined()
      const otherName = `inspect-child-${randomUUID()}`
      other = spawn(process.execPath, [`--inspect-port=127.0.0.1:${port}`, '-e', script, otherName], { stdio: ['ignore', 'pipe', 'pipe'] })
      await once(other.stdout!, 'data')
      await expect(inspectChildProcess(process.pid, otherName)).rejects.toThrow(`belongs to PID ${child.pid}`)
    } finally {
      for (const process of [other, child]) {
        if (process && process.exitCode === null && process.signalCode === null) {
          const exited = once(process, 'exit')
          process.kill()
          await exited
        }
      }
    }
  },
  15000,
)
