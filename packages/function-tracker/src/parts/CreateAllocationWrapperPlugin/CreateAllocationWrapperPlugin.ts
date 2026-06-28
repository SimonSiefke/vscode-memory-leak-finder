import type { NodePath, Visitor } from '@babel/core'
import * as t from '@babel/types'

export interface CreateAllocationWrapperPluginOptions {
  readonly allocationLocations?: Map<any, { line: number; column: number }>
  readonly scriptId?: number
}

const getLocation = (node: any, allocationLocations: Map<any, { line: number; column: number }>) => {
  const location = allocationLocations.get(node)
  if (location) {
    return location
  }
  if (node.loc?.start) {
    return {
      column: node.loc.start.column,
      line: node.loc.start.line,
    }
  }
  return {
    column: -1,
    line: -1,
  }
}

const isIdentifierNamed = (node: t.Node | null | undefined, name: string): node is t.Identifier => {
  return t.isIdentifier(node) && node.name === name
}

const isMemberExpressionNamed = (node: t.Node, objectName: string, propertyNames: readonly string[]): boolean => {
  if (!t.isMemberExpression(node) || node.computed) {
    return false
  }
  if (!isIdentifierNamed(node.object, objectName)) {
    return false
  }
  return t.isIdentifier(node.property) && propertyNames.includes(node.property.name)
}

const getNewExpressionType = (node: t.NewExpression): string => {
  const { callee } = node
  if (t.isIdentifier(callee)) {
    return callee.name
  }
  if (t.isMemberExpression(callee) && t.isIdentifier(callee.property)) {
    return callee.property.name
  }
  return 'NewExpression'
}

const getFactoryCallType = (path: NodePath<t.CallExpression>): string | undefined => {
  const { callee } = path.node
  if (isIdentifierNamed(callee, 'Array') && !path.scope.getBinding('Array')) {
    return 'Array'
  }
  if (isMemberExpressionNamed(callee, 'Array', ['from', 'of']) && !path.scope.getBinding('Array')) {
    return 'Array'
  }
  if (isMemberExpressionNamed(callee, 'Object', ['create']) && !path.scope.getBinding('Object')) {
    return 'Object'
  }
  return undefined
}

export const createAllocationWrapperPlugin = (options: CreateAllocationWrapperPluginOptions): Visitor => {
  const { allocationLocations = new Map(), scriptId = 123 } = options

  const wrapAllocation = (path: NodePath<t.Expression>, type: string) => {
    const node = path.node
    const location = getLocation(node, allocationLocations)
    const wrapped = t.callExpression(t.identifier('trackAllocation'), [
      node,
      t.numericLiteral(scriptId),
      t.numericLiteral(location.line),
      t.numericLiteral(location.column),
      t.stringLiteral(type),
    ])
    path.replaceWith(wrapped)
    path.skip()
  }

  const visitor: Visitor = {
    ArrayExpression: (path: NodePath<t.ArrayExpression>) => {
      wrapAllocation(path, 'Array')
    },

    CallExpression: (path: NodePath<t.CallExpression>) => {
      if (isIdentifierNamed(path.node.callee, 'trackAllocation')) {
        path.skip()
        return
      }
      const type = getFactoryCallType(path)
      if (!type) {
        return
      }
      wrapAllocation(path, type)
    },

    NewExpression: (path: NodePath<t.NewExpression>) => {
      wrapAllocation(path, getNewExpressionType(path.node))
    },

    ObjectExpression: (path: NodePath<t.ObjectExpression>) => {
      wrapAllocation(path, 'Object')
    },

    RegExpLiteral: (path: NodePath<t.RegExpLiteral>) => {
      wrapAllocation(path, 'RegExp')
    },
  }

  return visitor
}
