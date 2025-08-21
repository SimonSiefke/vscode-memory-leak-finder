import { test, expect } from '@jest/globals'
import type { ObjectNode, NumberNode, StringNode } from '../src/parts/AstNode/AstNode.ts'
import { printObject } from '../src/parts/PrintObject/PrintObject.ts'

test('printObject', () => {
  const node: ObjectNode = {
    type: 'object',
    id: 10,
    name: 'obj',
    properties: [
      { id: 10, name: 'x', value: { type: 'number', id: 11, value: 3 } as NumberNode },
      { id: 10, name: 'y', value: { type: 'string', id: 12, value: 'b' } as StringNode },
    ],
  }
  expect(printObject(node)).toEqual({ x: 3, y: 'b' })
})
