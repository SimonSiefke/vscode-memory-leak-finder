import { expect, test } from '@jest/globals'
import * as WaitForWebSocketToBeOpen from '../src/parts/WaitForWebSocketToBeOpen/WaitForWebSocketToBeOpen.ts'

test('waitForWebSocketToBeOpen function exists', () => {
  expect(typeof WaitForWebSocketToBeOpen.waitForWebSocketToBeOpen).toBe('function')
})
