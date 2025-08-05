import { test, expect } from '@jest/globals'

import * as CommandState from '../src/parts/CommandState/CommandState.ts'

test('registerCommand - should register a command function', () => {
  const mockFn = () => 'test'

  CommandState.registerCommand('test.register', mockFn)

  const registeredFn = CommandState.getCommand('test.register')
  expect(registeredFn).toBe(mockFn)
})

test('registerCommands - should register multiple commands', () => {
  const mockFn1 = () => 'test1'
  const mockFn2 = () => 'test2'
  const commandMap = {
    'test.multiple1': mockFn1,
    'test.multiple2': mockFn2,
  }

  CommandState.registerCommands(commandMap)

  expect(CommandState.getCommand('test.multiple1')).toBe(mockFn1)
  expect(CommandState.getCommand('test.multiple2')).toBe(mockFn2)
})

test('getCommand - should return undefined for unknown command', () => {
  const result = CommandState.getCommand('unknown.command')
  expect(result).toBeUndefined()
})
