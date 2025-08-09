import { expect, test, jest } from '@jest/globals'
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
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
  expect(() => Logger.log('test message')).not.toThrow()
  expect(consoleSpy).toHaveBeenCalledWith('test message')
  consoleSpy.mockRestore()
})

test('warn should not throw', () => {
  const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
  expect(() => Logger.warn('test warning')).not.toThrow()
  expect(consoleSpy).toHaveBeenCalledWith('test warning')
  consoleSpy.mockRestore()
})

test('error should not throw', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
  expect(() => Logger.error('test error')).not.toThrow()
  expect(consoleSpy).toHaveBeenCalledWith('test error')
  consoleSpy.mockRestore()
})
