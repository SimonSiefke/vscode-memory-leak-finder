declare global {
  const test: typeof import('@jest/globals')['test']
  const expect: typeof import('@jest/globals')['expect']
  const jest: typeof import('@jest/globals')['jest']
}

import * as Command from '../src/parts/Command/Command.js'
import * as CommandState from '../src/parts/CommandState/CommandState.js'

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
  }).toThrow('command not found: unknown.command')
})