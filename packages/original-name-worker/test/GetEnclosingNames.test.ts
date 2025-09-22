import type { NodePath } from '@babel/traverse'
import type * as t from '@babel/types'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import { test, expect } from '@jest/globals'
import { getEnclosingNames } from '../src/parts/GetEnclosingNames/GetEnclosingNames.ts'

const findBestPathAt = (code: string, line: number, column: number): NodePath => {
  const ast: t.File = parse(code, {
    sourceType: 'unambiguous',
    plugins: ['classProperties', 'classPrivateProperties', 'classPrivateMethods', 'decorators-legacy', 'jsx', 'typescript'],
    errorRecovery: true,
  }) as unknown as t.File

  const traverseFn = traverse
  let best: NodePath | null = null
  traverseFn(ast, {
    enter(path: NodePath) {
      const { node } = path
      if (!node.loc) {
        return
      }
      const startLine = node.loc.start.line - 1
      const endLine = node.loc.end.line - 1
      if (line < startLine || line > endLine) {
        return
      }
      if (best) {
        const prev = best.node.loc!
        const prevRange = (prev.end.line - prev.start.line) * 1000 + (prev.end.column - prev.start.column)
        const currRange = (node.loc.end.line - node.loc.start.line) * 1000 + (node.loc.end.column - node.loc.start.column)
        if (currRange <= prevRange) {
          best = path
        }
      } else {
        best = path
      }
    },
  })
  if (!best) {
    throw new Error('no node at position')
  }
  return best
}

test('getEnclosingNames - class method', () => {
  const code = `class ToolBar {\n  handleClick(){\n    return 1\n  }\n}`
  const path = findBestPathAt(code, 2, 2)
  expect(getEnclosingNames(path, { line: 2, column: 2 })).toBe('ToolBar.handleClick')
})

test('getEnclosingNames - function name', () => {
  const code = `function hello(){\n  return 1\n}`
  const path = findBestPathAt(code, 1, 1)
  expect(getEnclosingNames(path, { line: 1, column: 1 })).toBe('hello')
})

test('getEnclosingNames - variable arrow function', () => {
  const code = `const run = () => {\n  return 1\n}`
  const path = findBestPathAt(code, 1, 1)
  expect(getEnclosingNames(path, { line: 1, column: 1 })).toBe('run')
})
