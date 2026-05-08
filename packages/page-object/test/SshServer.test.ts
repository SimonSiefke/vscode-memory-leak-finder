import { expect, test } from '@jest/globals'
import { EventEmitter } from 'node:events'
import { createWithDependencies } from '../src/parts/SshServer/SshServer.ts'
import * as WellKnownCommands from '../src/parts/WellKnownCommands/WellKnownCommands.ts'

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
      createQuickPick: () => ({
        executeCommand: async () => {},
        pressEnter: async () => {},
        type: async () => {},
      }),
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

test('connect uses quick pick to connect current window to host', async () => {
  const calls: string[] = []
  const quickPick = {
    executeCommand: async (command: string, options?: { stayVisible?: boolean | 'dont-care' }) => {
      calls.push(`executeCommand:${command}:${JSON.stringify(options)}`)
    },
    pressEnter: async () => {
      calls.push('pressEnter')
    },
    type: async (value: string) => {
      calls.push(`type:${value}`)
    },
  }
  const page = {
    evaluate: async () => 'http://127.0.0.1:9888/',
    rebind: async () => {
      calls.push('rebind')
    },
    refresh: async () => {
      calls.push('refresh')
      return page
    },
    waitForIdle: async () => {
      calls.push('waitForIdle')
    },
  }

  const sshServer = createWithDependencies(
    {
      electronApp: {
        evaluate: async () => {
          throw new Error('electron evaluate should not be used for SSH connect')
        },
      },
      page,
      VError: class MockVError extends Error {
        constructor(error: unknown, message: string) {
          super(`${message}: ${error instanceof Error ? error.message : String(error)}`)
        }
      },
    },
    {
      createQuickPick: () => quickPick,
      spawnProcess: (() => {
        throw new Error('spawn should not be called during connect')
      }) as any,
      isPortOpen: async () => true,
      sleep: async () => {
        calls.push('sleep')
      },
    },
  )

  await sshServer.connect()

  expect(calls).toEqual([
    'waitForIdle',
    `executeCommand:${WellKnownCommands.RemoteSshConnectCurrentWindowToHost}:{"stayVisible":true}`,
    'type:http://127.0.0.1:9888/',
    'pressEnter',
    'refresh',
    'rebind',
    'waitForIdle',
  ])
})
