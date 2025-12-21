import { expect, test } from '@jest/globals'
import * as DebuggerCreateIpcConnection from '../src/parts/DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'

test('createConnection - error - invalid url', async () => {
  await expect(DebuggerCreateIpcConnection.createConnection('abc')).rejects.toThrow(
    new Error(`Failed to create websocket connection: SyntaxError: TypeError: Invalid URL`),
  )
})
