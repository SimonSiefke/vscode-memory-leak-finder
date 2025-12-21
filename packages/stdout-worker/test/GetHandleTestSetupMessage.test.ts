import { expect, test } from '@jest/globals'
import * as GetHandleTestSetupMessage from '../src/parts/GetHandleTestSetupMessage/GetHandleTestSetupMessage.ts'

test('getHandleTestSetupMessage - should return formatted setup message', () => {
  const result = GetHandleTestSetupMessage.getHandleTestSetupMessage()
  expect(result).toBe('\n\u001B[0m\u001B[7m\u001B[33m SETUP \u001B[39m\u001B[27m\u001B[0m\n')
})

test('getHandleTestSetupMessage - should always return the same message', () => {
  const result1 = GetHandleTestSetupMessage.getHandleTestSetupMessage()
  const result2 = GetHandleTestSetupMessage.getHandleTestSetupMessage()
  expect(result1).toBe(result2)
})
