import { expect, jest, test } from '@jest/globals'
import { createWithDependencies } from '../src/parts/Workbench/Workbench.ts'
import * as WellKnownCommands from '../src/parts/WellKnownCommands/WellKnownCommands.ts'

const createMockVError = class MockVError extends Error {
  constructor(error: unknown, message: string) {
    super(`${message}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

test('reload waits for refresh before rebinding the page', async () => {
  const calls: string[] = []
  const refreshedPage = {
    id: 'refreshed-page',
  }
  const workbenchElement = {
    id: 'workbench',
  }
  const page = {
    locator: (selector: string) => {
      calls.push(`locator:${selector}`)
      return workbenchElement
    },
    rebind: async (nextPage: unknown) => {
      calls.push(`rebind:${nextPage === refreshedPage}`)
    },
    refresh: async () => {
      calls.push('refresh')
      return refreshedPage
    },
    waitForIdle: async () => {
      calls.push('waitForIdle')
    },
    waitForRefresh: async () => {
      calls.push('waitForRefresh')
    },
  }
  const quickPick = {
    executeCommand: async (command: string, options?: { pressKeyOnce?: boolean; stayVisible?: boolean | 'dont-care' }) => {
      calls.push(`executeCommand:${command}:${JSON.stringify(options)}`)
    },
    getVisibleCommands: async () => [],
    pressEnter: async () => undefined,
    select: async () => undefined,
    showCommands: async () => undefined,
    type: async () => undefined,
  }
  const expectMock = (value: unknown) => {
    calls.push(`expect:${value === workbenchElement ? 'workbench' : 'value'}`)
    return {
      toBeVisible: async () => {
        calls.push('toBeVisible')
      },
    }
  }

  const workbench = createWithDependencies(
    {
      browserRpc: undefined,
      electronApp: {},
      expect: expectMock,
      ideVersion: { major: 1, minor: 0, patch: 0 },
      page,
      platform: 'linux',
      VError: createMockVError,
    } as any,
    {
      createQuickPick: () => quickPick as any,
      sleep: async () => undefined,
    },
  )

  await workbench.reload()

  expect(calls).toEqual([
    'waitForIdle',
    `executeCommand:${WellKnownCommands.DeveloperReloadWindow}:${JSON.stringify({
      stayVisible: true,
      pressKeyOnce: true,
      stopsApplication: true,
    })}`,
    'waitForRefresh',
    'refresh',
    'rebind:true',
    'waitForIdle',
    'locator:.monaco-workbench',
    'expect:workbench',
    'toBeVisible',
    'waitForIdle',
    'waitForIdle',
  ])
})

test('close runs the close window command without waiting for a refresh', async () => {
  const calls: string[] = []
  const page = {
    waitForIdle: async () => {
      calls.push('waitForIdle')
    },
  }
  const quickPick = {
    executeCommand: async (command: string, options?: { pressKeyOnce?: boolean; stayVisible?: boolean | 'dont-care' }) => {
      calls.push(`executeCommand:${command}:${JSON.stringify(options)}`)
    },
    getVisibleCommands: async () => [],
    pressEnter: async () => undefined,
    select: async () => undefined,
    showCommands: async () => undefined,
    type: async () => undefined,
  }

  const workbench = createWithDependencies(
    {
      browserRpc: undefined,
      electronApp: {},
      expect: () => ({
        toBeVisible: async () => undefined,
      }),
      ideVersion: { major: 1, minor: 0, patch: 0 },
      page,
      platform: 'linux',
      VError: createMockVError,
    } as any,
    {
      createQuickPick: () => quickPick as any,
      sleep: async () => undefined,
    },
  )

  await workbench.close()

  expect(calls).toEqual([
    'waitForIdle',
    `executeCommand:${WellKnownCommands.CloseWindow}:${JSON.stringify({
      stayVisible: true,
      pressKeyOnce: true,
      stopsApplication: true,
    })}`,
  ])
})
