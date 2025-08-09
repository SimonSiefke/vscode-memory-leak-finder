import { expect, test } from '@jest/globals'
import * as IpcError from '../src/parts/IpcError/IpcError.ts'

test('IpcError constructor creates error with message', () => {
  const error = new IpcError.IpcError('Test message')
  expect(error).toBeInstanceOf(Error)
  expect(error.name).toBe('IpcError')
  expect(error.message).toBe('Test message')
})

test('IpcError extends Error', () => {
  const error = new IpcError.IpcError('Test message')
  expect(error instanceof Error).toBe(true)
  expect(error instanceof IpcError.IpcError).toBe(true)
})
