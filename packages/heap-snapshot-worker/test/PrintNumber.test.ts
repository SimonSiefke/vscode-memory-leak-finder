import { test, expect } from '@jest/globals'
import type { NumberNode } from '../src/parts/AstNode/AstNode.ts'
import { printNumber } from '../src/parts/PrintNumber/PrintNumber.ts'

test('printNumber', () => {
  const node: NumberNode = { type: 'number', id: 1, value: 42 }
  expect(printNumber(node)).toBe(42)
})
