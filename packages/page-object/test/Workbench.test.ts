import { expect, test } from '@jest/globals'
import { createWithDependencies } from '../src/parts/Workbench/Workbench.ts'
import * as WellKnownCommands from '../src/parts/WellKnownCommands/WellKnownCommands.ts'

test('connectToSsh uses quick pick to connect current window to host', async () => {
  const calls: string[] = []
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

  const workbench = createWithDependencies(
    {
      browserRpc: undefined,
      electronApp: {},
      expect: {},
      ideVersion: { major: 1, minor: 0, patch: 0 },
      page,
      platform: 'linux',
      VError: class MockVError extends Error {
        constructor(error: unknown, message: string) {
          super(`${message}: ${error instanceof Error ? error.message : String(error)}`)
        }
      },
    } as any,
    {
      createQuickPick: () => quickPick,
      sleep: async () => {},
    },
  )

  await workbench.connectToSsh({ port: 9888 })

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
