import { test, expect } from '@jest/globals'
import { parse } from '@babel/parser'
import * as TraverseNS from '@babel/traverse'
import type { NodePath } from '@babel/traverse'
import type * as t from '@babel/types'
import { isLocationInside } from '../src/parts/IsLocationInside/IsLocationInside.ts'

const getFirstNodePath = (code: string): NodePath => {
  const ast: t.File = parse(code, {
    sourceType: 'unambiguous',
    plugins: ['classProperties', 'classPrivateProperties', 'classPrivateMethods', 'decorators-legacy', 'jsx', 'typescript'],
    errorRecovery: true,
  }) as unknown as t.File
  type TraverseFn = typeof import('@babel/traverse').default
  const resolveTraverse = (ns: unknown): TraverseFn => {
    if (typeof ns === 'function') {
      return ns as TraverseFn
    }
    const withDefault = ns as { default?: unknown }
    if (withDefault && typeof withDefault.default === 'function') {
      return withDefault.default as TraverseFn
    }
    if (withDefault && withDefault.default && typeof (withDefault.default as { default?: unknown }).default === 'function') {
      return (withDefault.default as { default: unknown }).default as TraverseFn
    }
    throw new TypeError('Invalid traverse import shape')
  }
  const traverseFn: TraverseFn = resolveTraverse(TraverseNS as unknown)
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
  const node: t.Node = path.node
  expect(isLocationInside(node, 0, 9)).toBe(true)
})

test('isLocationInside - outside node', () => {
  const code = `function demo(){\n  const x = 1\n}`
  const path = getFirstNodePath(code)
  const node: t.Node = path.node
  expect(isLocationInside(node, 10, 0)).toBe(false)
})
