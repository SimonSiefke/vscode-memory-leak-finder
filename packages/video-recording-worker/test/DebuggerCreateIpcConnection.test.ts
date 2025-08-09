import { test, expect, jest } from '@jest/globals'

test('DebuggerCreateIpcConnection - should throw error for invalid URL', async () => {
  const { createConnection } = await import('../src/parts/DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts')

  await expect(createConnection(123 as any)).rejects.toThrow()
  await expect(createConnection(null as any)).rejects.toThrow()
  await expect(createConnection(undefined as any)).rejects.toThrow()
})

test('DebuggerCreateIpcConnection - should handle WebSocket creation failure', async () => {
  jest.unstable_mockModule('ws', () => ({
    WebSocket: jest.fn(() => {
      throw new Error('WebSocket creation failed')
    }),
  }))

  const { createConnection } = await import('../src/parts/DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts')

  await expect(createConnection('ws://localhost:9222/test')).rejects.toThrow('Failed to create websocket connection')
})

test('DebuggerCreateIpcConnection - should handle wait for WebSocket failure', async () => {
  class MockWebSocket {
    send = jest.fn()
    onmessage: any = null
  }

  jest.unstable_mockModule('ws', () => ({
    WebSocket: jest.fn(() => new MockWebSocket()),
  }))

  jest.unstable_mockModule('../src/parts/WaitForWebSocketToBeOpen/WaitForWebSocketToBeOpen.ts', () => ({
    waitForWebSocketToBeOpen: jest.fn(() => Promise.reject(new Error('WebSocket open failed'))),
  }))

  const { createConnection } = await import('../src/parts/DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts')

  await expect(createConnection('ws://localhost:9222/test')).rejects.toThrow('Failed to create websocket connection')
})
