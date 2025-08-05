import { test, expect, jest } from '@jest/globals'

import * as Command from '../src/parts/Command/Command.ts'
import * as CommandState from '../src/parts/CommandState/CommandState.ts'

test('execute - should call registered command with arguments', () => {
  // Setup
  const mockFn = jest.fn().mockReturnValue('test result')
  CommandState.registerCommand('test.command', mockFn)

  // Execute
  const result = Command.execute('test.command', 'arg1', 'arg2')

  // Verify
  expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
  expect(result).toBe('test result')
})

test('execute - should throw CommandNotFoundError for unknown command', () => {
  expect(() => {
    Command.execute('unknown.command')
  }).toThrow('command unknown.command not found')
})
