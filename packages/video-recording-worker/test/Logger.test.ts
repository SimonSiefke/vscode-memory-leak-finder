import { expect, test } from '@jest/globals'
import * as Logger from '../src/parts/Logger/Logger.ts'

test('log function exists', () => {
  expect(typeof Logger.log).toBe('function')
})

test('warn function exists', () => {
  expect(typeof Logger.warn).toBe('function')
})

test('error function exists', () => {
  expect(typeof Logger.error).toBe('function')
})

test('log should not throw', () => {
  expect(() => Logger.log('test message')).not.toThrow()
})

test('warn should not throw', () => {
  expect(() => Logger.warn('test warning')).not.toThrow()
})

test('error should not throw', () => {
  expect(() => Logger.error('test error')).not.toThrow()
})
