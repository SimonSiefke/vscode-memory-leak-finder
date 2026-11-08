import { expect, jest, test } from '@jest/globals'
import { EventEmitter } from 'node:events'
import { createWithDependencies } from '../src/parts/Workbench/Workbench.ts'

const fixture = (execute: (events: EventEmitter) => Promise<void>) => {
  const events = Object.assign(new EventEmitter(), { invoke: jest.fn(async () => {}) })
  const visible = jest.fn(async () => {})
  const page = {
    sessionRpc: events,
    waitForIdle: jest.fn(async () => {}),
    refresh: jest.fn<() => Promise<object>>().mockResolvedValue({}),
    rebind: jest.fn(async (_value: object) => {}),
    locator: jest.fn(),
  }
  const executeCommand = jest.fn(async (_command: string, _options?: unknown) => execute(events))
  const sleep = jest.fn(async (_duration: number) => {})
  class VError extends Error {
    constructor(cause: unknown, message: string) {
      super(`${message}: ${String(cause)}`)
    }
  }
  const workbench = createWithDependencies({ page, expect: () => ({ toBeVisible: visible }), VError } as any, {
    createQuickPick: () => ({ executeCommand }) as any,
    sleep,
  })
  return { events, executeCommand, page, sleep, visible, workbench }
}

test('arms navigation before the reload command and reconnects after a transient context loss', async () => {
  const context = fixture(async (events) => {
    expect(events.listenerCount('Runtime.executionContextsCleared')).toBe(1)
    events.emit('Runtime.executionContextsCleared')
  })
  context.page.refresh.mockRejectedValueOnce(new Error('uniqueContextId not found'))
  await context.workbench.reload()
  expect(context.executeCommand).toHaveBeenCalledWith('Developer: Reload Window', { stopsApplication: true, stayVisible: 'dont-care' })
  expect(context.page.refresh).toHaveBeenCalledTimes(2)
  expect(context.page.rebind).toHaveBeenCalledTimes(1)
  expect(context.visible).toHaveBeenCalledTimes(1)
  expect(context.sleep).toHaveBeenCalledWith(100)
  expect(context.events.listenerCount('Runtime.executionContextsCleared')).toBe(0)
})

test('removes navigation listeners when invoking the command fails', async () => {
  const context = fixture(async () => {
    throw new Error('command unavailable')
  })
  await expect(context.workbench.reload()).rejects.toThrow('command unavailable')
  expect(context.events.listenerCount('Runtime.executionContextsCleared')).toBe(0)
  expect(context.page.refresh).not.toHaveBeenCalled()
})

test('does not retry unrelated failures while reconnecting', async () => {
  const context = fixture(async (events) => {
    events.emit('Runtime.executionContextsCleared')
  })
  context.page.refresh.mockRejectedValueOnce(new Error('protocol authentication failed'))
  await expect(context.workbench.reload()).rejects.toThrow('protocol authentication failed')
  expect(context.page.refresh).toHaveBeenCalledTimes(1)
  expect(context.sleep).not.toHaveBeenCalled()
  expect(context.events.listenerCount('Runtime.executionContextsCleared')).toBe(0)
})
