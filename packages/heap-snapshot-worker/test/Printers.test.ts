import { test, expect } from '@jest/globals'
import type { NumberNode, StringNode, BooleanNode, UndefinedNode, UnknownNode, CodeNode, ArrayNode, ObjectNode } from '../src/parts/AstNode/AstNode.ts'
import { printNumber } from '../src/parts/PrintNumber/PrintNumber.ts'
import { printString } from '../src/parts/PrintString/PrintString.ts'
import { printBoolean } from '../src/parts/PrintBoolean/PrintBoolean.ts'
import { printUndefined } from '../src/parts/PrintUndefined/PrintUndefined.ts'
import { printUnknown } from '../src/parts/PrintUnknown/PrintUnknown.ts'
import { printCodeLike } from '../src/parts/PrintCodeLike/PrintCodeLike.ts'
import { printArray } from '../src/parts/PrintArray/PrintArray.ts'
import { printObject } from '../src/parts/PrintObject/PrintObject.ts'

test('printNumber', () => {
  const node: NumberNode = { type: 'number', id: 1, value: 42 }
  expect(printNumber(node)).toBe(42)
})

test('printString', () => {
  const node: StringNode = { type: 'string', id: 2, value: 'hello' }
  expect(printString(node)).toBe('hello')
})

test('printBoolean', () => {
  const node: BooleanNode = { type: 'boolean', id: 3, value: true }
  expect(printBoolean(node)).toBe(true)
})

test('printUndefined', () => {
  const node: UndefinedNode = { type: 'undefined', id: 4 }
  expect(printUndefined(node)).toBeUndefined()
})

test('printUnknown', () => {
  const node: UnknownNode = { type: 'unknown', id: 5, value: '[x]' }
  expect(printUnknown(node)).toBe('[x]')
})

test('printCodeLike with location', () => {
  const node: CodeNode = { type: 'closure', id: 6, scriptId: 1, line: 2, column: 3 }
  expect(printCodeLike(node)).toBe('[function: 1:2:3]')
})

test('printArray', () => {
  const node: ArrayNode = {
    type: 'array',
    id: 7,
    elements: [
      { type: 'number', id: 8, value: 1 } as NumberNode,
      { type: 'string', id: 9, value: 'a' } as StringNode,
    ],
  }
  expect(printArray(node)).toEqual([1, 'a'])
})

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


