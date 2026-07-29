import { afterEach, expect, jest, test } from '@jest/globals'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer } from 'node:net'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { waitForUnixSocket } from '../src/parts/WaitForUnixSocket/WaitForUnixSocket.ts'

const temporaryDirectories: string[] = []

const createSocketPath = async (): Promise<string> => {
  const directory = await mkdtemp(join(tmpdir(), 'memory-leak-finder-socket-'))
  temporaryDirectories.push(directory)
  return join(directory, 'runtime.sock')
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })))
})

test('resolves when the Unix socket accepts connections', async () => {
  const socketPath = await createSocketPath()
  const server = createServer((socket) => {
    socket.end()
  })
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(socketPath, resolve)
  })

  await waitForUnixSocket({
    getOutput: () => '',
    hasExited: () => false,
    socketPath,
  })

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error)
        return
      }
      resolve()
    })
  })
})

test('reports process output when the runtime exits before opening the socket', async () => {
  const socketPath = await createSocketPath()
  const getOutput = jest.fn(() => 'stdout:\nbuild failed')

  await expect(
    waitForUnixSocket({
      getOutput,
      hasExited: () => true,
      socketPath,
    }),
  ).rejects.toThrow(`External runtime exited before Unix socket was ready
stdout:
build failed`)
  expect(getOutput).toHaveBeenCalledTimes(1)
})
