import { expect, test } from '@jest/globals'
import { extractReturnType } from '../src/generateApiTypes/ExtractReturnType.ts'

test('extractReturnType - no return type annotation', () => {
  const content = 'async method() { return }'
  const result = extractReturnType(content, 0, 'method')
  expect(result).toBe('Promise<void>')
})

test('extractReturnType - explicit Promise<void>', () => {
  const content = 'async method(): Promise<void> { }'
  const result = extractReturnType(content, 0, 'method')
  expect(result).toBe('Promise<void>')
})

test('extractReturnType - explicit Promise<string>', () => {
  const content = 'async method(): Promise<string> { }'
  const result = extractReturnType(content, 0, 'method')
  expect(result).toBe('Promise<string>')
})

test('extractReturnType - getInputValue pattern', () => {
  const content = 'async getInputValue() { return value }'
  const result = extractReturnType(content, 0, 'getInputValue')
  expect(result).toBe('Promise<string>')
})

test('extractReturnType - getVisibleCommands pattern', () => {
  const content = 'async getVisibleCommands() { return commands }'
  const result = extractReturnType(content, 0, 'getVisibleCommands')
  expect(result).toBe('Promise<string[]>')
})

test('extractReturnType - complex return type with braces', () => {
  const content = 'async method(): Promise<{ prop: string }> { }'
  const result = extractReturnType(content, 0, 'method')
  expect(result).toBe('Promise<any>')
})

test('extractReturnType - qualified type name', () => {
  const content = 'async method(): Promise<Server.ServerInfo> { }'
  const result = extractReturnType(content, 0, 'method')
  expect(result).toBe('Promise<any>')
})

test('extractReturnType - inferred from return statement with commands', () => {
  const content = 'async method() { return commands }'
  const result = extractReturnType(content, 0, 'method')
  expect(result).toBe('Promise<string[]>')
})

test('extractReturnType - inferred from return statement with getAttribute', () => {
  const content = 'async method() { return getAttribute(\'value\') }'
  const result = extractReturnType(content, 0, 'method')
  expect(result).toBe('Promise<string>')
})
