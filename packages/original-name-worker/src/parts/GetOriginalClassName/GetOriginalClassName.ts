import { parse } from '@babel/parser'
import * as TraverseNS from '@babel/traverse'
import type { NodePath } from '@babel/traverse'
import type * as t from '@babel/types'
import { getEnclosingNames } from '../GetEnclosingNames/GetEnclosingNames.ts'
import { fallbackScan } from '../FallbackScan/FallbackScan.ts'
import { isLocationInside } from '../IsLocationInside/IsLocationInside.ts'

const LOCATION_UNKNOWN: string = 'unknown'

export const getOriginalClassName = (sourceContent: string, originalLine: number, originalColumn: number): string => {
  if (!sourceContent) {
    return LOCATION_UNKNOWN
  }

  if (sourceContent.includes('class extends ')) {
    const fb: string = fallbackScan(sourceContent, originalLine)
    if (fb !== LOCATION_UNKNOWN) {
      return fb
    }
  }

  let ast: t.File
  try {
    ast = parse(sourceContent, {
      sourceType: 'unambiguous',
      plugins: ['classProperties', 'classPrivateProperties', 'classPrivateMethods', 'decorators-legacy', 'jsx', 'typescript'],
      ranges: false,
      errorRecovery: true,
      tokens: false,
    }) as unknown as t.File
  } catch {
    return LOCATION_UNKNOWN
  }

  const traverseFn = TraverseNS.default

  let bestPath: NodePath | null = null
  traverseFn(ast, {
    enter(path: NodePath) {
      const node: t.Node = path.node
      if (!node.loc) {
        return
      }
      if (isLocationInside(node, originalLine, originalColumn)) {
        if (!bestPath) {
          bestPath = path
        } else {
          const prev = bestPath.node.loc!
          const curr = node.loc
          const prevRange = (prev.end.line - prev.start.line) * 1000 + (prev.end.column - prev.start.column)
          const currRange = (curr.end.line - curr.start.line) * 1000 + (curr.end.column - curr.start.column)
          if (currRange <= prevRange) {
            bestPath = path
          }
        }
      }
    },
  })

  if (!bestPath) {
    const fallback: string = fallbackScan(sourceContent, originalLine)
    return fallback
  }

  const name: string = getEnclosingNames(bestPath, { line: originalLine, column: originalColumn })
  if (name && name !== LOCATION_UNKNOWN) {
    return name
  }
  const fallback: string = fallbackScan(sourceContent, originalLine)
  return fallback
}
