import { test, expect, jest } from '@jest/globals'
import * as DebuggerCreateRpcConnection from '../src/parts/DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import * as ObjectType from '../src/parts/ObjectType/ObjectType.ts'

test('DebuggerCreateRpcConnection - createRpc should create RPC object', () => {
  const mockIpc = {
    send: jest.fn(),
    onmessage: null,
  }

  const rpc = DebuggerCreateRpcConnection.createRpc(mockIpc)

  expect(rpc.objectType).toBe(ObjectType.Rpc)
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
  const mockIpc = {
    send: jest.fn(),
    onmessage: null,
  }

  const rpc = DebuggerCreateRpcConnection.createRpc(mockIpc)

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

test('DebuggerCreateRpcConnection - invoke should handle error response', async () => {
  const mockIpc = {
    send: jest.fn(),
    onmessage: null,
  }

  const rpc = DebuggerCreateRpcConnection.createRpc(mockIpc)

  const invokePromise = rpc.invoke('testMethod', {})

  // Simulate error response
  const handleMessage = mockIpc.onmessage
  if (handleMessage) {
    handleMessage({
      id: 0,
      error: { message: 'test error' },
    })
  }

  const result = await invokePromise
  expect(result).toEqual({ id: 0, error: { message: 'test error' } })
})

test('DebuggerCreateRpcConnection - invokeWithSession should send message with sessionId', async () => {
  const mockIpc = {
    send: jest.fn(),
    onmessage: null,
  }

  const rpc = DebuggerCreateRpcConnection.createRpc(mockIpc)

  const invokePromise = rpc.invokeWithSession('session123', 'testMethod', { param: 'value' })

  expect(mockIpc.send).toHaveBeenCalledWith({
    sessionId: 'session123',
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

test('DebuggerCreateRpcConnection - on should register listener', () => {
  const mockIpc = {
    send: jest.fn(),
    onmessage: null,
  }

  const rpc = DebuggerCreateRpcConnection.createRpc(mockIpc)
  const listener = jest.fn()

  rpc.on('testEvent', listener)

  // Simulate event
  const handleMessage = mockIpc.onmessage
  if (handleMessage) {
    handleMessage({
      method: 'testEvent',
      params: { data: 'test' },
    })
  }

  expect(listener).toHaveBeenCalledWith({
    method: 'testEvent',
    params: { data: 'test' },
  })
})

test('DebuggerCreateRpcConnection - once should register one-time listener', async () => {
  const mockIpc = {
    send: jest.fn(),
    onmessage: null,
  }

  const rpc = DebuggerCreateRpcConnection.createRpc(mockIpc)

  const oncePromise = rpc.once('testEvent')

  // Simulate event
  const handleMessage = mockIpc.onmessage
  if (handleMessage) {
    handleMessage({
      method: 'testEvent',
      params: { data: 'test' },
    })
  }

  const result = await oncePromise
  expect(result).toEqual({
    method: 'testEvent',
    params: { data: 'test' },
  })
})

test('DebuggerCreateRpcConnection - should handle messages without listener', () => {
  const mockIpc = {
    send: jest.fn(),
    onmessage: null,
  }

  const rpc = DebuggerCreateRpcConnection.createRpc(mockIpc)

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
