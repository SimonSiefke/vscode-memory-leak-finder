import { expect, test } from '@jest/globals'
import * as GetHandleTestSetupMessage from '../src/parts/GetHandleTestSetupMessage/GetHandleTestSetupMessage.ts'

test('getHandleTestSetupMessage - should return formatted setup message', () => {
  const result = GetHandleTestSetupMessage.getHandleTestSetupMessage()
  expect(result).toBe('\n\u{1B}[0m\u{1B}[7m\u{1B}[33m SETUP \u{1B}[39m\u{1B}[27m\u{1B}[0m\n')
})

test('getHandleTestSetupMessage - should always return the same message', () => {
  const result1 = GetHandleTestSetupMessage.getHandleTestSetupMessage()
  const result2 = GetHandleTestSetupMessage.getHandleTestSetupMessage()
  expect(result1).toBe(result2)
})
