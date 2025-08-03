import { expect, test, jest } from '@jest/globals'
import { log } from '../src/parts/Logger/Logger.js'

test('log calls console.log with message', () => {
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
  const message = 'test message'

  log(message)

  expect(consoleSpy).toHaveBeenCalledWith(message)
  consoleSpy.mockRestore()
})

test('log handles empty string', () => {
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
  const message = ''

  log(message)

  expect(consoleSpy).toHaveBeenCalledWith(message)
  consoleSpy.mockRestore()
})

test('log handles complex objects', () => {
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
  const message = { key: 'value', number: 123 }

  log(message)

  expect(consoleSpy).toHaveBeenCalledWith(message)
  consoleSpy.mockRestore()
})
