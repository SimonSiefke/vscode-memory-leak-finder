import { test, expect } from '@jest/globals'
import * as ConnectDevtools from '../src/parts/ConnectDevtools/ConnectDevtools.ts'
import * as SessionState from '../src/parts/SessionState/SessionState.ts'

test('ConnectDevtools - connectDevtools should throw with invalid URL', async () => {
  await expect(ConnectDevtools.connectDevtools('invalid-url')).rejects.toThrow()
})

test('ConnectDevtools - connectDevtools should throw with non-string input', async () => {
  await expect(ConnectDevtools.connectDevtools(123 as any)).rejects.toThrow()
  await expect(ConnectDevtools.connectDevtools(null as any)).rejects.toThrow()
  await expect(ConnectDevtools.connectDevtools(undefined as any)).rejects.toThrow()
})

test('ConnectDevtools - connectDevtools should throw with empty string', async () => {
  await expect(ConnectDevtools.connectDevtools('')).rejects.toThrow()
})
