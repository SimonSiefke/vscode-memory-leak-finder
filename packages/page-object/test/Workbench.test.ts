import { expect, jest, test } from '@jest/globals'
import { createWithDependencies } from '../src/parts/Workbench/Workbench.ts'
import * as WellKnownCommands from '../src/parts/WellKnownCommands/WellKnownCommands.ts'

const createMockVError = class MockVError extends Error {
  constructor(error: unknown, message: string) {
    super(`${message}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

test('connectToSsh uses quick pick to connect current window to host', async () => {
  const calls: string[] = []
  let now = 0
  let platformSelected = false
  const dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => now)
  const page = {
    evaluate: async () => 'http://127.0.0.1:9888/',
    locator: () => ({
      isVisible: async () => !platformSelected,
    }),
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
    getVisibleCommands: async () => {
      calls.push('getVisibleCommands')
      if (platformSelected) {
        throw new createMockVError(new Error('widget hidden'), 'Failed to get visible commands')
      }
      return ['Linux', 'Windows', 'macOS']
    },
    pressEnter: async () => {
      calls.push('pressEnter')
    },
    select: async (value: string | RegExp) => {
      platformSelected = true
      calls.push(`select:${value}`)
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
      VError: createMockVError,
    } as any,
    {
      createQuickPick: () => quickPick,
      sleep: async (milliseconds: number) => {
        now += milliseconds
      },
    },
  )

  await workbench.connectToSsh({ alias: 'local-test' })

  expect(calls).toEqual([
    'waitForIdle',
    'showCommands:{"pressKeyOnce":true}',
    `type:${WellKnownCommands.RemoteSshConnectCurrentWindowToHost}`,
    'pressEnter',
    'type:local-test',
    'waitForIdle',
    'pressEnter',
    'getVisibleCommands',
    'select:Linux',
    'refresh',
    'rebind',
    'waitForIdle',
    'waitForIdle',
    'waitForIdle',
  ])

  dateNowSpy.mockRestore()
})

test('connectToSsh waits for a delayed remote host platform prompt', async () => {
  const calls: string[] = []
  let now = 0
  let selected = false
  const dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => now)

  const page = {
    locator: () => ({
      isVisible: async () => now >= 6_000 && !selected,
    }),
    refresh: async () => {
      calls.push('refresh')
      return page
    },
    rebind: async () => {
      calls.push('rebind')
    },
    waitForIdle: async () => {
      calls.push('waitForIdle')
    },
  }

  const quickPick = {
    executeCommand: async () => {
      throw new Error('executeCommand should not be used for SSH connect')
    },
    getVisibleCommands: async () => {
      calls.push('getVisibleCommands')
      if (now < 6_000 || selected) {
        throw new createMockVError(new Error('widget hidden'), 'Failed to get visible commands')
      }
      return ['Linux', 'Windows', 'macOS']
    },
    pressEnter: async () => {
      calls.push('pressEnter')
    },
    select: async (value: string | RegExp) => {
      selected = true
      calls.push(`select:${value}`)
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
      VError: createMockVError,
    } as any,
    {
      createQuickPick: () => quickPick,
      sleep: async (milliseconds: number) => {
        now += milliseconds
      },
    },
  )

  await workbench.connectToSsh({ alias: 'local-test' })

  expect(calls).toContain('select:Linux')
  dateNowSpy.mockRestore()
})
