import { expect, test } from '@jest/globals'
import * as GetHandleTestPassedMessage from '../src/parts/GetHandleTestPassedMessage/GetHandleTestPassedMessage.ts'

test('getHandleTestPassedMessage - skip leak case', () => {
  const result = GetHandleTestPassedMessage.getHandleTestPassedMessage(
    '/test/app.test.js',
    '/test',
    'app.test.js',
    100,
    true, // isLeak
    true  // wasOriginallySkipped
  )
  expect(result).toContain('SKIP (LEAK)')
})

test('getHandleTestPassedMessage - skip pass case', () => {
  const result = GetHandleTestPassedMessage.getHandleTestPassedMessage(
    '/test/app.test.js',
    '/test',
    'app.test.js',
    100,
    false, // isLeak
    true   // wasOriginallySkipped
  )
  expect(result).toContain('SKIP (PASS)')
})

test('getHandleTestPassedMessage - leak case', () => {
  const result = GetHandleTestPassedMessage.getHandleTestPassedMessage(
    '/test/app.test.js',
    '/test',
    'app.test.js',
    100,
    true,  // isLeak
    false  // wasOriginallySkipped
  )
  expect(result).toContain('LEAK')
})

test('getHandleTestPassedMessage - pass case', () => {
  const result = GetHandleTestPassedMessage.getHandleTestPassedMessage(
    '/test/app.test.js',
    '/test',
    'app.test.js',
    100,
    false, // isLeak
    false  // wasOriginallySkipped
  )
  expect(result).toContain('PASS')
})
