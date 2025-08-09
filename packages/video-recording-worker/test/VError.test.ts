import { test, expect } from '@jest/globals'
import * as VError from '../src/parts/VError/VError.ts'

test('VError - should export VError from @lvce-editor/verror', () => {
  expect(VError.VError).toBeDefined()
  expect(typeof VError.VError).toBe('function')
})

test('VError - should create error with message', () => {
  const message = 'test error message'
  const error = new VError.VError(message)
  expect(error.message).toBe(message)
  expect(error instanceof Error).toBe(true)
})

test('VError - should create error with cause', () => {
  const cause = new Error('cause error')
  const message = 'wrapper error'
  const error = new VError.VError(cause, message)
  expect(error.message).toBe(message)
  expect(error.cause).toBe(cause)
})
