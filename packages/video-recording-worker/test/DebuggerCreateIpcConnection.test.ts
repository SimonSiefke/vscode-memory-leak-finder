import { test, expect, jest } from '@jest/globals'
import * as DebuggerCreateIpcConnection from '../src/parts/DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import { WebSocket } from 'ws'

jest.mock('ws', () => ({
  WebSocket: jest.fn(),
}))

jest.mock('../src/parts/WaitForWebSocketToBeOpen/WaitForWebSocketToBeOpen.ts', () => ({
  waitForWebSocketToBeOpen: jest.fn(),
}))

jest.mock('../src/parts/Json/Json.ts', () => ({
  stringify: jest.fn((obj) => JSON.stringify(obj)),
}))

const { waitForWebSocketToBeOpen } = require('../src/parts/WaitForWebSocketToBeOpen/WaitForWebSocketToBeOpen.ts')
const { stringify } = require('../src/parts/Json/Json.ts')

class MockWebSocket {
  send = jest.fn()
  onmessage: any = null
}

test('DebuggerCreateIpcConnection - should throw error for invalid URL', async () => {
  await expect(DebuggerCreateIpcConnection.createConnection(123 as any)).rejects.toThrow()
  await expect(DebuggerCreateIpcConnection.createConnection(null as any)).rejects.toThrow()
  await expect(DebuggerCreateIpcConnection.createConnection(undefined as any)).rejects.toThrow()
})

test('DebuggerCreateIpcConnection - should create connection successfully', async () => {
  const mockWebSocket = new MockWebSocket()
  ;(WebSocket as jest.Mock).mockImplementation(() => mockWebSocket)
  ;(waitForWebSocketToBeOpen as jest.Mock).mockResolvedValue(undefined)

  const connection = await DebuggerCreateIpcConnection.createConnection('ws://localhost:9222/test')

  expect(WebSocket).toHaveBeenCalledWith('ws://localhost:9222/test')
  expect(waitForWebSocketToBeOpen).toHaveBeenCalledWith(mockWebSocket)
  expect(connection.send).toBeDefined()
  expect(typeof connection.send).toBe('function')
})

test('DebuggerCreateIpcConnection - connection should send messages', async () => {
  const mockWebSocket = new MockWebSocket()
  ;(WebSocket as jest.Mock).mockImplementation(() => mockWebSocket)
  ;(waitForWebSocketToBeOpen as jest.Mock).mockResolvedValue(undefined)

  const connection = await DebuggerCreateIpcConnection.createConnection('ws://localhost:9222/test')
  const message = { method: 'test', params: {} }

  connection.send(message)

  expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message))
  expect(stringify).toHaveBeenCalledWith(message)
})

test('DebuggerCreateIpcConnection - connection should handle onmessage getter/setter', async () => {
  const mockWebSocket = new MockWebSocket()
  ;(WebSocket as jest.Mock).mockImplementation(() => mockWebSocket)
  ;(waitForWebSocketToBeOpen as jest.Mock).mockResolvedValue(undefined)

  const connection = await DebuggerCreateIpcConnection.createConnection('ws://localhost:9222/test')
  
  // Test getter
  expect(connection.onmessage).toBe(mockWebSocket.onmessage)

  // Test setter
  const mockListener = jest.fn()
  connection.onmessage = mockListener

  // Simulate WebSocket message
  const mockEvent = { data: JSON.stringify({ method: 'test', params: {} }) }
  if (mockWebSocket.onmessage) {
    mockWebSocket.onmessage(mockEvent)
  }

  expect(mockListener).toHaveBeenCalledWith({ method: 'test', params: {} })
})

test('DebuggerCreateIpcConnection - should handle WebSocket creation failure', async () => {
  ;(WebSocket as jest.Mock).mockImplementation(() => {
    throw new Error('WebSocket creation failed')
  })

  await expect(DebuggerCreateIpcConnection.createConnection('ws://localhost:9222/test')).rejects.toThrow('Failed to create websocket connection')
})

test('DebuggerCreateIpcConnection - should handle wait for WebSocket failure', async () => {
  const mockWebSocket = new MockWebSocket()
  ;(WebSocket as jest.Mock).mockImplementation(() => mockWebSocket)
  ;(waitForWebSocketToBeOpen as jest.Mock).mockRejectedValue(new Error('WebSocket open failed'))

  await expect(DebuggerCreateIpcConnection.createConnection('ws://localhost:9222/test')).rejects.toThrow('Failed to create websocket connection')
})
