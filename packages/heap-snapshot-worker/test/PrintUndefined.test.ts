import { test, expect } from '@jest/globals'
import type { UndefinedNode } from '../src/parts/AstNode/AstNode.ts'
import { printUndefined } from '../src/parts/PrintUndefined/PrintUndefined.ts'

test('printUndefined', () => {
  const node: UndefinedNode = { type: 'undefined', id: 4 }
  expect(printUndefined(node)).toBeUndefined()
})
