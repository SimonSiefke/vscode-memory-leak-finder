import { expect, test } from '@jest/globals'
import type { AstNode } from '../src/parts/AstNode/AstNode.ts'
import { isObjectNode } from '../src/parts/IsObjectNode/IsObjectNode.ts'

test('isObjectNode: returns true for object node and narrows type', () => {
  const node: AstNode = { type: 'object', id: 1, name: 'Object', properties: [] }
  if (!isObjectNode(node)) {
    throw new Error('expected object node')
  }
  // Type is narrowed to ObjectNode here
  expect(node.type).toBe('object')
  expect(Array.isArray(node.properties)).toBe(true)
})

test('isObjectNode: returns false for non-object nodes', () => {
  const a: AstNode = { type: 'string', id: 2, name: 's', value: 's' }
  const b: AstNode = { type: 'number', id: 3, name: 'n', value: 1 }
  const c: AstNode = { type: 'array', id: 4, name: 'arr', elements: [] }
  expect(isObjectNode(a)).toBe(false)
  expect(isObjectNode(b)).toBe(false)
  expect(isObjectNode(c)).toBe(false)
})
