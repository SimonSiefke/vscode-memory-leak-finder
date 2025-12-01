import { test, expect } from '@jest/globals'
import type { ObjectNode, NumberNode, AstNode } from '../src/parts/AstNode/AstNode.ts'
import { printAst, printAstRoots } from '../src/parts/PrintAst/PrintAst.ts'

test('print simple object with number', () => {
  const ast: ObjectNode = {
    type: 'object',
    id: 1,
    name: 'abc',
    properties: [
      {
        id: 1,
        name: 'x',
        value: { type: 'number', id: 2, value: 123 } as NumberNode,
      },
    ],
  }
  const printed = printAst(ast)
  expect(printed).toEqual({ x: 123 })
})

test('print roots helper', () => {
  const roots: AstNode[] = [
    {
      type: 'object',
      id: 10,
      name: 'root',
      properties: [
        { id: 10, name: 'a', value: { type: 'string', id: 11, value: 'hi' } as any },
        { id: 10, name: 'b', value: { type: 'boolean', id: 12, value: true } as any },
      ],
    } as any,
  ]
  const printed = printAstRoots(roots)
  expect(printed).toEqual([{ a: 'hi', b: true }])
})
