import { expect, test } from '@jest/globals'
import * as GetHandleTestSetupMessage from '../src/parts/GetHandleTestSetupMessage/GetHandleTestSetupMessage.js'

test('getHandleTestSetupMessage - should return formatted setup message', () => {
  const result = GetHandleTestSetupMessage.getHandleTestSetupMessage()
  expect(result).toBe('\n\u001b[0m\u001b[7m\u001b[33m SETUP \u001b[39m\u001b[27m\u001b[0m\n')
})

test('getHandleTestSetupMessage - should always return the same message', () => {
  const result1 = GetHandleTestSetupMessage.getHandleTestSetupMessage()
  const result2 = GetHandleTestSetupMessage.getHandleTestSetupMessage()
  expect(result1).toBe(result2)
})
