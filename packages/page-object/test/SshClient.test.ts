import { expect, jest, test } from '@jest/globals'
import { createWithDependencies } from '../src/parts/SshClient/SshClient.ts'
import * as WellKnownCommands from '../src/parts/WellKnownCommands/WellKnownCommands.ts'

const createMockVError = class MockVError extends Error {
  constructor(error: unknown, message: string) {
    super(`${message}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

test('connectToSsh uses quick pick to connect current window to host', async () => {
  const calls: string[] = []
  let now = 0
  let hostSelected = false
  let platformSelected = false
  const dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => now)
  const page = {
    evaluate: async () => false,
    locator: () => {
      return {
        isVisible: async () => hostSelected && !platformSelected,
      }
    },
    rebind: async () => {
      calls.push('rebind')
    },
    refresh: async () => {
      calls.push('refresh')
      return page
    },
    waitForRefresh: async () => {
      calls.push('waitForRefresh')
    },
    waitForIdle: async () => {
      calls.push('waitForIdle')
    },
  }

  const quickPick = {
    executeCommand: async (command: string, options?: { pressKeyOnce?: boolean; stayVisible?: boolean | 'dont-care' }) => {
      calls.push(`executeCommand:${command}:${JSON.stringify(options)}`)
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
      if (value instanceof RegExp) {
        hostSelected = true
      } else {
        platformSelected = true
      }
      calls.push(`select:${value}`)
    },
    showCommands: async (options?: { pressKeyOnce?: boolean }) => {
      calls.push(`showCommands:${JSON.stringify(options)}`)
    },
    type: async (value: string) => {
      calls.push(`type:${value}`)
    },
  }

  const sshClient = createWithDependencies(
    {
      browserRpc: undefined,
      electronApp: {},
      expect: () => ({
        toBeFocused: async () => {
          calls.push('expect:toBeFocused')
        },
        toBeHidden: async () => undefined,
        toBeVisible: async (options?: { timeout?: number }) => {
          calls.push(`expect:toBeVisible:${JSON.stringify(options)}`)
        },
      }),
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

  await sshClient.connectToSsh({ alias: 'local-test' })

  expect(calls).toEqual([
    'waitForRefresh',
    'waitForIdle',
    `executeCommand:${WellKnownCommands.RemoteSshConnectCurrentWindowToHost}:${JSON.stringify({
      stayVisible: true,
      pressKeyOnce: true,
    })}`,
    'select:/local-test/',
    'refresh',
    'rebind',
    'expect:toBeVisible:undefined',
    'expect:toBeFocused',
    'select:Linux',
    'waitForIdle',
    'waitForIdle',
    'expect:toBeVisible:{"timeout":60000}',
    'waitForIdle',
  ])

  dateNowSpy.mockRestore()
})

test('connectToSsh waits for a delayed remote host platform prompt', async () => {
  const calls: string[] = []
  let now = 0
  let hostSelected = false
  let platformSelected = false
  const dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => now)

  const page = {
    evaluate: async () => false,
    locator: () => {
      return {
        isVisible: async () => hostSelected && now >= 6_000 && !platformSelected,
      }
    },
    refresh: async () => {
      calls.push('refresh')
      return page
    },
    waitForRefresh: async () => {
      calls.push('waitForRefresh')
    },
    rebind: async () => {
      calls.push('rebind')
    },
    waitForIdle: async () => {
      calls.push('waitForIdle')
    },
  }

  const quickPick = {
    executeCommand: async (command: string, options?: { pressKeyOnce?: boolean; stayVisible?: boolean | 'dont-care' }) => {
      calls.push(`executeCommand:${command}:${JSON.stringify(options)}`)
    },
    getVisibleCommands: async () => {
      calls.push('getVisibleCommands')
      if (now < 6_000 || platformSelected) {
        throw new createMockVError(new Error('widget hidden'), 'Failed to get visible commands')
      }
      return ['Linux', 'Windows', 'macOS']
    },
    pressEnter: async () => {
      calls.push('pressEnter')
    },
    select: async (value: string | RegExp) => {
      if (value instanceof RegExp) {
        if (now < 6_000) {
          throw new createMockVError(new Error('host not visible yet'), 'Failed to select host')
        }
        hostSelected = true
      } else {
        platformSelected = true
      }
      calls.push(`select:${value}`)
    },
    showCommands: async (options?: { pressKeyOnce?: boolean }) => {
      calls.push(`showCommands:${JSON.stringify(options)}`)
    },
    type: async (value: string) => {
      calls.push(`type:${value}`)
    },
  }

  const sshClient = createWithDependencies(
    {
      browserRpc: undefined,
      electronApp: {},
      expect: () => ({
        toBeFocused: async () => undefined,
        toBeHidden: async () => undefined,
        toBeVisible: async () => undefined,
      }),
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

  await sshClient.connectToSsh({ alias: 'local-test' })

  expect(calls[0]).toBe('waitForRefresh')
  expect(calls.indexOf('refresh')).toBeLessThan(calls.indexOf('select:Linux'))
  expect(calls).toContain('select:Linux')
  dateNowSpy.mockRestore()
})

test('waitForConnectionReady waits for ssh status bar item', async () => {
  const calls: string[] = []
  const statusBarItem = {
    id: 'status-bar-item',
  }
  const page = {
    locator: (selector: string) => {
      calls.push(`locator:${selector}`)
      return statusBarItem
    },
    waitForIdle: async () => {
      calls.push('waitForIdle')
    },
  }

  const sshClient = createWithDependencies(
    {
      browserRpc: undefined,
      electronApp: {},
      expect: (value: unknown) => ({
        toBeFocused: async () => undefined,
        toBeHidden: async () => undefined,
        toBeVisible: async (options?: { timeout?: number }) => {
          calls.push(`expect:${value === statusBarItem ? 'statusBarItem' : 'value'}:${JSON.stringify(options)}`)
        },
      }),
      ideVersion: { major: 1, minor: 0, patch: 0 },
      page,
      platform: 'linux',
      VError: createMockVError,
    } as any,
    {
      createQuickPick: () => {
        throw new Error('not expected')
      },
      sleep: async () => undefined,
    },
  )

  await sshClient.waitForConnectionReady({ alias: 'local-test' })

  expect(calls).toEqual([
    'waitForIdle',
    'locator:.statusbar-item-label[aria-label*="SSH: local-test"]',
    'expect:statusBarItem:{"timeout":60000}',
    'waitForIdle',
  ])
})
