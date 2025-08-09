import { expect, test } from '@jest/globals'

const DebuggerCreateIpcConnection = await import('../src/parts/DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.js')

test('createConnection - error - invalid url', async () => {
  await expect(DebuggerCreateIpcConnection.createConnection('abc')).rejects.toThrow(
    new Error(`Failed to create websocket connection: TypeError: Invalid URL`),
  )
})
