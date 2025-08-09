import { test, expect, jest } from '@jest/globals'

test('DebuggerCreateRpcConnection - createRpc should create RPC object', async () => {
  const { createRpc } = await import('../src/parts/DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts')
  const { Rpc } = await import('../src/parts/ObjectType/ObjectType.ts')

  const mockIpc = {
    send: jest.fn(),
    onmessage: null,
  }

  const rpc = createRpc(mockIpc)

  expect(rpc.objectType).toBe(Rpc)
  expect(rpc.invoke).toBeDefined()
  expect(rpc.invokeWithSession).toBeDefined()
  expect(rpc.on).toBeDefined()
  expect(rpc.once).toBeDefined()
  expect(typeof rpc.invoke).toBe('function')
  expect(typeof rpc.invokeWithSession).toBe('function')
  expect(typeof rpc.on).toBe('function')
  expect(typeof rpc.once).toBe('function')
})

test('DebuggerCreateRpcConnection - invoke should send message and handle response', async () => {
  const { createRpc } = await import('../src/parts/DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts')

  const mockIpc = {
    send: jest.fn(),
    onmessage: null,
  }

  const rpc = createRpc(mockIpc)

  const invokePromise = rpc.invoke('testMethod', { param: 'value' })

  expect(mockIpc.send).toHaveBeenCalledWith({
    method: 'testMethod',
    params: { param: 'value' },
    id: 0,
  })

  // Simulate response
  const handleMessage = mockIpc.onmessage
  if (handleMessage) {
    handleMessage({
      id: 0,
      result: { success: true },
    })
  }

  const result = await invokePromise
  expect(result).toEqual({ id: 0, result: { success: true } })
})

test('DebuggerCreateRpcConnection - should handle messages without listener', async () => {
  const { createRpc } = await import('../src/parts/DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts')

  const mockIpc = {
    send: jest.fn(),
    onmessage: null,
  }

  const rpc = createRpc(mockIpc)

  // Simulate event without listener
  const handleMessage = mockIpc.onmessage
  expect(() => {
    if (handleMessage) {
      handleMessage({
        method: 'unknownEvent',
        params: { data: 'test' },
      })
    }
  }).not.toThrow()
})
