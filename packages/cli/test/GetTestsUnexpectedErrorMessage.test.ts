import { test, expect } from '@jest/globals'
import * as GetTestsUnexpectedErrorMessage from '../src/parts/GetTestsUnexpectedErrorMessage/GetTestsUnexpectedErrorMessage.ts'

test('getTestsUnexpectedErrorMessage - formats error with all properties', async () => {
  const error = {
    type: 'TypeError',
    message: 'Cannot read property of undefined',
    stack: 'TypeError: Cannot read property of undefined\n    at Object.<anonymous> (/path/to/file.js:10:5)',
    codeFrame: 'const result = obj.property\n             ^^^',
  }

  const result = await GetTestsUnexpectedErrorMessage.getTestsUnexpectedErrorMessage(error)

  expect(result).toContain('TypeError: Cannot read property of undefined')
  expect(result).toContain('const result = obj.property')
  expect(result).toContain('at Object.<anonymous>')
})

test('getTestsUnexpectedErrorMessage - handles error with empty codeFrame', async () => {
  const error = {
    type: 'ReferenceError',
    message: 'variable is not defined',
    stack: 'ReferenceError: variable is not defined\n    at test.js:5:1',
    codeFrame: '',
  }

  const result = await GetTestsUnexpectedErrorMessage.getTestsUnexpectedErrorMessage(error)

  expect(result).toContain('ReferenceError: variable is not defined')
  expect(result).toContain('test.js')
  expect(result).toContain(':5:1')
})

test('getTestsUnexpectedErrorMessage - handles error with no codeFrame', async () => {
  const error = {
    type: 'SyntaxError',
    message: 'Unexpected token',
    stack: 'SyntaxError: Unexpected token\n    at Module._compile (module.js:434:26)',
    codeFrame: null,
  }

  const result = await GetTestsUnexpectedErrorMessage.getTestsUnexpectedErrorMessage(error)

  expect(result).toContain('SyntaxError: Unexpected token')
  expect(result).toContain('at Module._compile')
})

test('getTestsUnexpectedErrorMessage - returns string with proper structure', async () => {
  const error = {
    type: 'Error',
    message: 'Something went wrong',
    stack: 'Error: Something went wrong\n    at test:1:1',
    codeFrame: 'line of code',
  }

  const result = await GetTestsUnexpectedErrorMessage.getTestsUnexpectedErrorMessage(error)

  expect(typeof result).toBe('string')
  expect(result.startsWith('FAIL')).toBe(false) // Should start with UnexpectedError prefix
  expect(result.endsWith('\n')).toBe(true)
})

test('getTestsUnexpectedErrorMessage - handles multiline stack trace', async () => {
  const error = {
    type: 'Error',
    message: 'Test error',
    stack: 'Error: Test error\n    at first.js:1:1\n    at second.js:2:2\n    at third.js:3:3',
    codeFrame: 'some code\nmore code',
  }

  const result = await GetTestsUnexpectedErrorMessage.getTestsUnexpectedErrorMessage(error)

  expect(result).toContain('first.js')
  expect(result).toContain(':1:1')
  expect(result).toContain('second.js')
  expect(result).toContain(':2:2')
  expect(result).toContain('third.js')
  expect(result).toContain(':3:3')
  expect(result).toContain('some code')
  expect(result).toContain('more code')
})
