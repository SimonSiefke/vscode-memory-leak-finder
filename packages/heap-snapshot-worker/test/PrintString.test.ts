import { test, expect } from '@jest/globals'
import type { StringNode } from '../src/parts/AstNode/AstNode.ts'
import { printString } from '../src/parts/PrintString/PrintString.ts'

test('printString', () => {
  const node: StringNode = { type: 'string', id: 2, value: 'hello' }
  expect(printString(node)).toBe('hello')
})
