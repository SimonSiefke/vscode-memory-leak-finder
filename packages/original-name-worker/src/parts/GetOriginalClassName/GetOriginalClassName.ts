import type { NodePath } from '@babel/traverse'
import type * as t from '@babel/types'
import { parse } from '@babel/parser'
import { default as traverse } from '@babel/traverse'
import { fallbackScan } from '../FallbackScan/FallbackScan.ts'
import { getEnclosingNames } from '../GetEnclosingNames/GetEnclosingNames.ts'
import { isLocationInside } from '../IsLocationInside/IsLocationInside.ts'

const LOCATION_UNKNOWN: string = 'unknown'

export const getOriginalClassName = (
  sourceContent: string,
  originalLine: number,
  originalColumn: number,
  originalFileName: string,
): string => {
  if (!sourceContent) {
    return LOCATION_UNKNOWN + ' in ' + originalFileName
  }

  let ast: t.File
  try {
    // Handle "class extends" case by temporarily adding a class name
    let processedSource = sourceContent
    if (sourceContent.includes('class extends ') && !sourceContent.match(/class\s+\w+\s+extends/)) {
      processedSource = sourceContent.replace(/class\s+extends/g, 'class AnonymousClass extends')
    }
    
    ast = parse(processedSource, {
      sourceType: 'unambiguous',
      plugins: ['classProperties', 'classPrivateProperties', 'classPrivateMethods', 'decorators-legacy', 'jsx', 'typescript'],
      ranges: false,
      errorRecovery: true,
      tokens: false,
    }) as unknown as t.File
  } catch {
    return LOCATION_UNKNOWN + ' in ' + originalFileName
  }

  const traverseFn = traverse

  let bestPath: NodePath | null = null
  traverseFn(ast, {
    enter(path: NodePath) {
      const { node } = path
      if (!node.loc) {
        return
      }
      if (isLocationInside(node, originalLine, originalColumn)) {
        if (bestPath) {
          const prev = bestPath.node.loc!
          const curr = node.loc
          const prevRange = (prev.end.line - prev.start.line) * 1000 + (prev.end.column - prev.start.column)
          const currRange = (curr.end.line - curr.start.line) * 1000 + (curr.end.column - curr.start.column)
          if (currRange <= prevRange) {
            bestPath = path
          }
        } else {
          bestPath = path
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
