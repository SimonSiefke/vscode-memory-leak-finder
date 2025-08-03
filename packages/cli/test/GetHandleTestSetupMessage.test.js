import { expect, test } from '@jest/globals'

const GetHandleTestSetupMessage = await import('../src/parts/GetHandleTestSetupMessage/GetHandleTestSetupMessage.js')

test('getHandleTestSetupMessage - should return formatted setup message', () => {
  const result = GetHandleTestSetupMessage.getHandleTestSetupMessage()
  expect(result).toBe(
    '\n\u001B[0m\u001B[7m\u001B[33m SETUP \u001B[39m\u001B[27m\u001B[0m \u001B[2mLaunching IDE and connecting to devtools...\u001B[22m\n',
  )
})

test('getHandleTestSetupMessage - should always return the same message', () => {
  const result1 = GetHandleTestSetupMessage.getHandleTestSetupMessage()
  const result2 = GetHandleTestSetupMessage.getHandleTestSetupMessage()
  expect(result1).toBe(result2)
})
