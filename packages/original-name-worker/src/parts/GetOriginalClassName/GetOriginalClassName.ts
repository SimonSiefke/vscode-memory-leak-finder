import type { NodePath } from '@babel/traverse'
import type * as t from '@babel/types'
import { parseAst } from '../ParseAst/ParseAst.ts'
import { fallbackScan } from '../FallbackScan/FallbackScan.ts'
import { getEnclosingNames } from '../GetEnclosingNames/GetEnclosingNames.ts'
import { isLocationInside } from '../IsLocationInside/IsLocationInside.ts'
import { traverseAst } from '../GetTraverse/GetTraverse.ts'

const LOCATION_UNKNOWN: string = 'unknown'

export const getOriginalClassName = (
  sourceContent: string,
  originalLine: number,
  originalColumn: number,
  originalFileName: string,
): string => {
  console.log(`[OriginalNameWorker] getOriginalClassName called for ${originalFileName}:${originalLine}:${originalColumn}`)
  const startTime = performance.now()

  if (!sourceContent) {
    console.log(`[OriginalNameWorker] No source content, returning unknown`)
    return LOCATION_UNKNOWN + ' in ' + originalFileName
  }

  let ast: t.File
  try {
    console.log(`[OriginalNameWorker] Parsing AST for ${originalFileName}`)
    const parseTime = performance.now()
    ast = parseAst(sourceContent)
    console.log(`[OriginalNameWorker] AST parsed in ${(performance.now() - parseTime).toFixed(2)}ms`)
  } catch {
    console.log(`[OriginalNameWorker] AST parsing failed for ${originalFileName}`)
    return LOCATION_UNKNOWN + ' in ' + originalFileName
  }

  console.log(`[OriginalNameWorker] Traversing AST for ${originalFileName}`)
  const traverseTime = performance.now()
  let bestPath: NodePath | null = null
  traverseAst(ast, {
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
  console.log(`[OriginalNameWorker] AST traversal completed in ${(performance.now() - traverseTime).toFixed(2)}ms`)

  if (!bestPath) {
    console.log(`[OriginalNameWorker] No best path found, using fallback scan for ${originalFileName}`)
    const fallbackTime = performance.now()
    const fallback: string = fallbackScan(sourceContent, originalLine)
    console.log(`[OriginalNameWorker] Fallback scan completed in ${(performance.now() - fallbackTime).toFixed(2)}ms`)
    return fallback
  }

  console.log(`[OriginalNameWorker] Getting enclosing names for ${originalFileName}`)
  const namesTime = performance.now()
  const name: string = getEnclosingNames(bestPath, { line: originalLine, column: originalColumn })
  console.log(`[OriginalNameWorker] Enclosing names retrieved in ${(performance.now() - namesTime).toFixed(2)}ms`)

  if (name && name !== LOCATION_UNKNOWN) {
    const totalTime = performance.now() - startTime
    console.log(`[OriginalNameWorker] getOriginalClassName completed in ${totalTime.toFixed(2)}ms, result: ${name}`)
    return name
  }

  console.log(`[OriginalNameWorker] Using fallback scan for ${originalFileName}`)
  const fallbackTime = performance.now()
  const fallback: string = fallbackScan(sourceContent, originalLine)
  console.log(`[OriginalNameWorker] Fallback scan completed in ${(performance.now() - fallbackTime).toFixed(2)}ms`)

  const totalTime = performance.now() - startTime
  console.log(`[OriginalNameWorker] getOriginalClassName completed in ${totalTime.toFixed(2)}ms, result: ${fallback}`)
  return fallback
}
