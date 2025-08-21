import { test, expect } from '@jest/globals'
import type { CodeNode } from '../src/parts/AstNode/AstNode.ts'
import { printCodeLike } from '../src/parts/PrintCodeLike/PrintCodeLike.ts'

test('printCodeLike with location', () => {
  const node: CodeNode = { type: 'closure', id: 6, scriptId: 1, line: 2, column: 3 }
  expect(printCodeLike(node)).toBe('[function: 1:2:3]')
})
