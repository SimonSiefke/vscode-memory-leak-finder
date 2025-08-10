import { expect, test } from '@jest/globals'
import * as GetHandleTestSetupMessage from '../src/parts/GetHandleTestSetupMessage/GetHandleTestSetupMessage.ts'

test('getHandleTestSetupMessage - should return formatted setup message', async () => {
  const result = await GetHandleTestSetupMessage.getHandleTestSetupMessage()
  expect(result).toBe('\n\u001b[0m\u001b[7m\u001b[33m SETUP \u001b[39m\u001b[27m\u001b[0m\n')
})

test('getHandleTestSetupMessage - should always return the same message', async () => {
  const result1 = await GetHandleTestSetupMessage.getHandleTestSetupMessage()
  const result2 = await GetHandleTestSetupMessage.getHandleTestSetupMessage()
  expect(result1).toBe(result2)
})
