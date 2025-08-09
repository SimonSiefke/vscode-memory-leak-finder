import { test, expect, jest } from '@jest/globals'

test('DebuggerCreateIpcConnection - should throw error for invalid URL', async () => {
  const { createConnection } = await import('../src/parts/DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts')
  
  await expect(createConnection(123 as any)).rejects.toThrow()
  await expect(createConnection(null as any)).rejects.toThrow()
  await expect(createConnection(undefined as any)).rejects.toThrow()
})
