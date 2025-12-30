import { expect, test } from '@jest/globals'
import * as ParseSourceLocation from '../src/parts/ParseSourceLocation/ParseSourceLocation.ts'

test('parseSourceLocation - parses valid source location', () => {
  const result = ParseSourceLocation.parseSourceLocation(
    '.vscode-extensions/github.copilot-chat-0.36.2025121004/dist/extension.js:917:1277',
  )
  expect(result).toEqual({
    url: '.vscode-extensions/github.copilot-chat-0.36.2025121004/dist/extension.js',
    line: 917,
    column: 1277,
  })
})

test('parseSourceLocation - returns null for empty string', () => {
  const result = ParseSourceLocation.parseSourceLocation('')
  expect(result).toBeNull()
})

test('parseSourceLocation - returns null for invalid format', () => {
  const result = ParseSourceLocation.parseSourceLocation('invalid-format')
  expect(result).toBeNull()
})

test('parseSourceLocation - returns null for missing line number', () => {
  const result = ParseSourceLocation.parseSourceLocation('file.js:123')
  expect(result).toBeNull()
})

test('parseSourceLocation - handles absolute paths', () => {
  const result = ParseSourceLocation.parseSourceLocation('/absolute/path/to/file.js:10:20')
  expect(result).toEqual({
    url: '/absolute/path/to/file.js',
    line: 10,
    column: 20,
  })
})

test('parseSourceLocation - handles paths with colons in filename', () => {
  const result = ParseSourceLocation.parseSourceLocation('file:name.js:5:10')
  expect(result).toEqual({
    url: 'file:name.js',
    line: 5,
    column: 10,
  })
})

