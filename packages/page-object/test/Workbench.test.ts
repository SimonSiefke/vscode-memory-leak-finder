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
    executeCommand: async () => {
      throw new Error('executeCommand should not be used for SSH connect')
    },
    pressEnter: async () => {
      calls.push('pressEnter')
    },
    showCommands: async (options?: { pressKeyOnce?: boolean }) => {
      calls.push(`showCommands:${JSON.stringify(options)}`)
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

  await workbench.connectToSsh({ alias: 'local-test' })

  expect(calls).toEqual([
    'waitForIdle',
    'showCommands:{"pressKeyOnce":true}',
    `type:${WellKnownCommands.RemoteSshConnectCurrentWindowToHost}`,
    'pressEnter',
    'type:local-test',
    'pressEnter',
    'refresh',
    'rebind',
    'waitForIdle',
  ])
})
