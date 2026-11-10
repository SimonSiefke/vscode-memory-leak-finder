import type { NodePath, Visitor } from '@babel/core'
import * as t from '@babel/types'

export interface CreateAllocationWrapperPluginOptions {
  readonly trackBytes?: boolean
  readonly allocationLocations?: Map<any, { line: number; column: number }>
  readonly scriptId?: number | string
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
  const { allocationLocations = new Map(), scriptId = 123, trackBytes = false } = options
  const trackerName = trackBytes ? 'trackAllocationBytes' : 'trackAllocation'
  const scriptIdNode = typeof scriptId === 'number' ? t.numericLiteral(scriptId) : t.stringLiteral(scriptId)

  const wrapAllocation = (path: NodePath<t.Expression>, type: string) => {
    const node = path.node
    const location = getLocation(node, allocationLocations)
    const wrapped = t.callExpression(t.identifier(trackerName), [
      node,
      scriptIdNode,
      t.numericLiteral(location.line),
      t.numericLiteral(location.column),
      t.stringLiteral(type),
    ])
    path.replaceWith(wrapped)
    path.skip()
  }

  if (trackBytes) {
    return {
      // Visit children first so nested allocations get their own shallow size.
      Expression: {
        enter(path: NodePath<t.Expression>) {
          if (t.isCallExpression(path.node) && isIdentifierNamed(path.node.callee, trackerName)) path.skip()
        },
        exit(path: NodePath<t.Expression>) {
          const node = path.node
          if (t.isArrayExpression(node)) wrapAllocation(path, 'Array')
          else if (t.isObjectExpression(node)) wrapAllocation(path, 'Object')
          else if (t.isNewExpression(node)) wrapAllocation(path, getNewExpressionType(node))
          else if (t.isRegExpLiteral(node)) wrapAllocation(path, 'RegExp')
          else if (t.isCallExpression(node)) {
            const factoryType = getFactoryCallType(path as NodePath<t.CallExpression>)
            if (factoryType) wrapAllocation(path, factoryType)
            else if (
              t.isIdentifier(node.callee) &&
              ['String', 'Number', 'BigInt'].includes(node.callee.name) &&
              !path.scope.getBinding(node.callee.name)
            ) {
              wrapAllocation(path, node.callee.name)
            }
          } else if (t.isTemplateLiteral(node) && node.expressions.length > 0 && !path.parentPath.isTaggedTemplateExpression()) {
            wrapAllocation(path, 'Computed')
          } else if (
            t.isBinaryExpression(node) &&
            !['in', 'instanceof', '==', '!=', '===', '!==', '<', '<=', '>', '>='].includes(node.operator)
          ) {
            wrapAllocation(path, 'Computed')
          } else if (t.isAssignmentExpression(node) && !['=', '&&=', '||=', '??='].includes(node.operator)) {
            wrapAllocation(path, 'Computed')
          } else if (t.isUnaryExpression(node) && ['+', '-', '~'].includes(node.operator)) {
            wrapAllocation(path, 'Computed')
          }
        },
      },
    }
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
