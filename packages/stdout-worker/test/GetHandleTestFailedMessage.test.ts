import { expect, test } from '@jest/globals'
import * as GetHandleTestFailedMessage from '../src/parts/GetHandleTestFailedMessage/GetHandleTestFailedMessage.ts'

const error = {
  codeFrame: '1 | throw new Error()',
  message: 'test failed',
  stack: 'Error: test failed\n    at test (src/sample.ts:1:1)',
  type: 'Error',
}

test('getHandleTestFailedMessage - shows duration for skipped failed test', () => {
  const result = GetHandleTestFailedMessage.getHandleTestFailedMessage(
    '/test/src/sample.ts',
    'src',
    'src/sample.ts',
    'sample.ts',
    error,
    true,
    2_220_000,
    true,
  )

  expect(result).toContain('SKIP (FAIL)')
  expect(result).toContain('2220.000 s')
})

test('getHandleTestFailedMessage - hides duration for skipped failed test', () => {
  const result = GetHandleTestFailedMessage.getHandleTestFailedMessage(
    '/test/src/sample.ts',
    'src',
    'src/sample.ts',
    'sample.ts',
    error,
    true,
    2_220_000,
    false,
  )

  expect(result).toContain('SKIP (FAIL)')
  expect(result).not.toContain('2220.000 s')
})

test('getHandleTestFailedMessage - hides duration for regular failed test', () => {
  const result = GetHandleTestFailedMessage.getHandleTestFailedMessage(
    '/test/src/sample.ts',
    'src',
    'src/sample.ts',
    'sample.ts',
    error,
    false,
    2_220_000,
    true,
  )

  expect(result).toContain('FAIL')
  expect(result).not.toContain('2220.000 s')
})
