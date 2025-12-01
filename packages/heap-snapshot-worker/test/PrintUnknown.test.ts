import { test, expect } from '@jest/globals'
import type { UnknownNode } from '../src/parts/AstNode/AstNode.ts'
import { printUnknown } from '../src/parts/PrintUnknown/PrintUnknown.ts'

test('printUnknown', () => {
  const node: UnknownNode = { type: 'unknown', id: 5, value: '[x]' }
  expect(printUnknown(node)).toBe('[x]')
})
