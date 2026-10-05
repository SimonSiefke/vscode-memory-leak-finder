import type { NodePath } from '@babel/traverse'
import type * as t from '@babel/types'
import { traverseAst } from '../GetTraverse/GetTraverse.ts'
import { isLocationInside } from '../IsLocationInside/IsLocationInside.ts'
import { parseAst } from '../ParseAst/ParseAst.ts'

const getExpressionName = (node: any): string => {
  if (node?.type === 'Identifier') {
    return node.name
  }
  if (node?.type === 'MemberExpression' || node?.type === 'OptionalMemberExpression') {
    const objectName = getExpressionName(node.object)
    const propertyName =
      node.property?.type === 'Identifier' ? node.property.name : node.property?.type === 'StringLiteral' ? node.property.value : ''
    return objectName && propertyName ? `${objectName}.${propertyName}` : propertyName
  }
  if (node?.type === 'TSInstantiationExpression') {
    return getExpressionName(node.expression)
  }
  return ''
}

const getLocationSize = (node: t.Node): number => {
  if (!node.loc) {
    return Number.POSITIVE_INFINITY
  }
  return (node.loc.end.line - node.loc.start.line) * 100_000 + node.loc.end.column - node.loc.start.column
}

const getConstructorNameFromAst = (ast: t.File, originalLine: number, originalColumn: number): string => {
  let bestPath: NodePath<t.NewExpression> | undefined
  traverseAst(ast, {
    NewExpression(path: NodePath<t.NewExpression>) {
      if (!isLocationInside(path.node, originalLine, originalColumn)) {
        return
      }
      if (!bestPath || getLocationSize(path.node) <= getLocationSize(bestPath.node)) {
        bestPath = path
      }
    },
  })
  return bestPath ? getExpressionName(bestPath.node.callee) : ''
}

const getConstructorNameFromLine = (sourceContent: string, originalLine: number, originalColumn: number): string => {
  const line = sourceContent.split('\n')[originalLine] || ''
  const matches = [...line.matchAll(/\bnew\s+([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)/g)]
  const closest = matches.toSorted((a, b) => {
    return Math.abs((a.index || 0) - originalColumn) - Math.abs((b.index || 0) - originalColumn)
  })[0]
  return closest?.[1] || ''
}

export const getOriginalConstructorName = (
  sourceContent: string,
  originalLine: number,
  originalColumn: number,
  _originalFileName: string,
): string => {
  if (!sourceContent) {
    return ''
  }
  try {
    const ast = parseAst(sourceContent)
    return getConstructorNameFromAst(ast, originalLine, originalColumn)
  } catch {
    return getConstructorNameFromLine(sourceContent, originalLine, originalColumn)
  }
}
