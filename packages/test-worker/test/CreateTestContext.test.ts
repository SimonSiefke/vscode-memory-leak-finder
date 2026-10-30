import { expect, test } from '@jest/globals'
import { createPageObjectContext } from '../src/parts/CreateTestContext/CreateTestContext.ts'
import * as PageObjectState from '../src/parts/PageObjectState/PageObjectState.ts'

test('normal and direct-launch scenarios share Electron and isolated-world context wiring', async () => {
  const calls: any[] = []
  const renderer = {
    invoke: async (method: string, options: any) => {
      calls.push({ method, options })
      return { result: { result: { type: 'boolean', value: true } } }
    },
  }
  const main = { invoke: async () => ({ result: {} }) }
  const page = { sessionRpc: renderer }
  const context = createPageObjectContext({
    browserRpc: renderer,
    electronObjectId: 'electron',
    electronRpc: main,
    idleTimeout: 0,
    page,
    sessionRpc: renderer,
    utilityContext: { id: 7, uniqueId: 'world' },
    ideVersion: { major: 1, minor: 140, patch: 0 },
    platform: 'linux',
    workspacePath: '/isolated/workspace',
  })
  await context.utilityContext.evaluate({ expression: 'true' })
  expect(calls[0]).toMatchObject({ method: 'Runtime.evaluate', options: { uniqueContextId: 'world', expression: 'true' } })
  expect(calls[0].options.contextId).toBeUndefined()
  expect(context.electronApp.rpc).toBe(main)
  expect(context.electronApp.firstWindow()).toBe(page)
  expect(context.workspacePath).toBe('/isolated/workspace')
  const next = { sessionRpc: renderer }
  context.electronApp.rebind({ firstWindow: next, sessionRpc: renderer })
  expect(context.electronApp.firstWindow()).toBe(next)
})

test('disposing a scenario releases the page-object state used by shared idle calls', () => {
  PageObjectState.set(1, {}, {})
  expect(PageObjectState.getPageObjectContext(1)).toEqual({})
  PageObjectState.deletePageObject(1)
  expect(() => PageObjectState.getPageObjectContext(1)).toThrow('no page object context')
})
