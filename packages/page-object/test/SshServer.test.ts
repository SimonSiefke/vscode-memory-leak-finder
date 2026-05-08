import { expect, test } from '@jest/globals'
import { EventEmitter } from 'node:events'
import { createWithDependencies } from '../src/parts/SshServer/SshServer.ts'

class MockChildProcess extends EventEmitter {
  stdout = new EventEmitter()
  stderr = new EventEmitter()
  exitCode: number | null = null
  signalCode: NodeJS.Signals | null = null
  pid = 123

  kill(): void {}
}

test('launch waits for port to be ready before resolving', async () => {
  const childProcess = new MockChildProcess()
  const calls: string[] = []
  let portChecks = 0

  const sshServer = createWithDependencies(
    {
      electronApp: {},
      page: {},
      VError: class MockVError extends Error {
        constructor(error: unknown, message: string) {
          super(`${message}: ${error instanceof Error ? error.message : String(error)}`)
        }
      },
    },
    {
      spawnProcess: () => {
        calls.push('spawn')
        return childProcess as any
      },
      isPortOpen: async () => {
        portChecks += 1
        calls.push(`isPortOpen:${portChecks}`)
        return portChecks >= 2
      },
      sleep: async () => {
        calls.push('sleep')
      },
    },
  )

  await sshServer.launch()

  expect(calls).toEqual(['spawn', 'isPortOpen:1', 'sleep', 'isPortOpen:2'])
})
