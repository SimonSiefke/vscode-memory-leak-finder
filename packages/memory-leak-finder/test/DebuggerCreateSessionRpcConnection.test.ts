import { expect, jest, test } from '@jest/globals'
import { createSessionRpcConnection } from '../src/parts/DebuggerCreateSessionRpcConnection/DebuggerCreateSessionRpcConnection.ts'

test('session rpc can invoke target and root browser commands', async () => {
  const invoke = jest.fn(async (_method: string, _params: unknown) => ({ result: 'browser' }))
  const invokeWithSession = jest.fn(async (_sessionId: string, _method: string, _params: unknown) => ({ result: 'target' }))
  const rpc = {
    callbacks: {},
    connectionClosed: () => false,
    dispose() {},
    invoke,
    invokeWithSession,
    listeners: {},
    off() {},
    on() {},
    once() {},
  }
  const session = createSessionRpcConnection(rpc, 'session-1', 'target-1')

  await session.invoke('Runtime.evaluate', { expression: '1' })
  await session.invokeBrowser('Tracing.requestMemoryDump', { levelOfDetail: 'detailed' })

  expect(invokeWithSession).toHaveBeenCalledWith('session-1', 'Runtime.evaluate', { expression: '1' })
  expect(invoke).toHaveBeenCalledWith('Tracing.requestMemoryDump', { levelOfDetail: 'detailed' })
})
