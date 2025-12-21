import { test, expect } from '@jest/globals'
import type { ArrayNode, NumberNode, StringNode } from '../src/parts/AstNode/AstNode.ts'
import { printArray } from '../src/parts/PrintArray/PrintArray.ts'

test('printArray', () => {
  const node: ArrayNode = {
    type: 'array',
    id: 7,
    elements: [{ type: 'number', id: 8, value: 1 } as NumberNode, { type: 'string', id: 9, value: 'a' } as StringNode],
  }
  expect(printArray(node)).toEqual([1, 'a'])
})
