import type { NodePath } from '@babel/traverse'
import type * as t from '@babel/types'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import { test, expect } from '@jest/globals'
import { isLocationInside } from '../src/parts/IsLocationInside/IsLocationInside.ts'

const getFirstNodePath = (code: string): NodePath => {
  const ast: t.File = parse(code, {
    sourceType: 'unambiguous',
    plugins: ['classProperties', 'classPrivateProperties', 'classPrivateMethods', 'decorators-legacy', 'jsx', 'typescript'],
    errorRecovery: true,
  }) as unknown as t.File
  // Handle different module formats for @babel/traverse
  const traverseFn = traverse as unknown as typeof import('@babel/traverse').default
  let found: NodePath | null = null
  traverseFn(ast, {
    enter(path: NodePath) {
      if (!found && path.node.loc) {
        found = path
      }
    },
  })
  if (!found) {
    throw new Error('no node found')
  }
  return found
}

test('isLocationInside - inside function declaration', () => {
  const code = `function demo(){\n  const x = 1\n}`
  const path = getFirstNodePath(code)
  const { node } = path
  expect(isLocationInside(node, 0, 9)).toBe(true)
})

test('isLocationInside - outside node', () => {
  const code = `function demo(){\n  const x = 1\n}`
  const path = getFirstNodePath(code)
  const { node } = path
  expect(isLocationInside(node, 10, 0)).toBe(false)
})
