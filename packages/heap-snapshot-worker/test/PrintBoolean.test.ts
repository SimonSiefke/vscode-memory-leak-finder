import { test, expect } from '@jest/globals'
import type { BooleanNode } from '../src/parts/AstNode/AstNode.ts'
import { printBoolean } from '../src/parts/PrintBoolean/PrintBoolean.ts'

test('printBoolean', () => {
  const node: BooleanNode = { type: 'boolean', id: 3, value: true }
  expect(printBoolean(node)).toBe(true)
})
