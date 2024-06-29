import { jest, test, expect, beforeEach } from '@jest/globals'

beforeEach(() => {
  jest.resetAllMocks()
})

jest.unstable_mockModule('ws', () => {
  return {
    WebSocket: jest.fn(),
  }
})

const ws = await import('ws')
const DebuggerCreateIpcConnection = await import('../src/parts/DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.js')

test('createConnection - error - invalid url', async () => {
  // @ts-ignore
  ws.WebSocket.mockImplementation((url) => {
    throw new SyntaxError(`Invalid URL: ${url}`)
  })
  await expect(DebuggerCreateIpcConnection.createConnection('abc')).rejects.toThrowError(
    new Error(`Failed to create websocket connection: SyntaxError: Invalid URL: abc`),
  )
})
