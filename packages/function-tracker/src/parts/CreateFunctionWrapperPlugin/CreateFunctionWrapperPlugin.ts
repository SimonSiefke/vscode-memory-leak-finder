import type { NodePath, Visitor } from '@babel/core'
import * as t from '@babel/types'

export interface CreateFunctionWrapperPluginOptions {
  readonly scriptId?: number
  readonly filename?: string
  readonly excludePatterns?: string[]
  readonly preambleOffset?: number
  readonly functionLocations?: Map<any, { line: number; column: number }>
}

export const createFunctionWrapperPlugin = (options: CreateFunctionWrapperPluginOptions): Visitor => {
  const { scriptId = 123, excludePatterns = [], functionLocations = new Map() } = options

  // Add tracking system functions to exclude patterns
  const allExcludePatterns = [...excludePatterns, 'getFunctionStatistics', 'resetFunctionStatistics']

  // Helper function to get function name from node
  const getFunctionName = (node: any): string => {
    if (t.isFunctionDeclaration(node) && node.id) {
      return node.id.name
    }
    if (t.isFunctionExpression(node) && node.id) {
      return node.id.name
    }
    if ((t.isObjectMethod(node) || t.isClassMethod(node)) && t.isIdentifier(node.key)) {
      return node.key.name
    }
    return 'anonymous'
  }

  // Helper function to check if function should be excluded
  const shouldExclude = (node: any): boolean => {
    const functionName = getFunctionName(node)
    return allExcludePatterns.some((pattern) => functionName.includes(pattern))
  }

  const createTrackingCall = (node: any) => {
    const location = functionLocations.get(node)

    let line = -1
    let column = -1
    if (location) {
      line = location.line
      column = location.column
    } else if (node.loc?.start) {
      line = node.loc.start.line
      column = node.loc.start.column
    }

    return t.expressionStatement(
      t.callExpression(t.identifier('trackFunctionCall'), [t.numericLiteral(scriptId), t.numericLiteral(line), t.numericLiteral(column)]),
    )
  }

  // Transform visitor - locations are already collected
  const transformVisitor: Visitor = {
    FunctionDeclaration: (path: NodePath<t.FunctionDeclaration>) => {
      if (!shouldExclude(path.node)) {
        // Wrap function body
        const originalBody: t.BlockStatement = path.node.body
        const trackingCall = createTrackingCall(path.node)

        path.node.body = t.blockStatement([trackingCall, ...originalBody.body])
      }
    },

    FunctionExpression: (path: NodePath<t.FunctionExpression>) => {
      if (!shouldExclude(path.node)) {
        const originalBody: t.BlockStatement = path.node.body
        const trackingCall = createTrackingCall(path.node)

        path.node.body = t.blockStatement([trackingCall, ...originalBody.body])
      }
    },

    ObjectMethod: (path: NodePath<t.ObjectMethod>) => {
      if (!shouldExclude(path.node)) {
        const originalBody: t.BlockStatement = path.node.body
        const trackingCall = createTrackingCall(path.node)

        path.node.body = t.blockStatement([trackingCall, ...originalBody.body])
      }
    },

    ClassMethod: (path: NodePath<t.ClassMethod>) => {
      if (!shouldExclude(path.node)) {
        const originalBody: t.BlockStatement = path.node.body
        const trackingCall = createTrackingCall(path.node)

        path.node.body = t.blockStatement([trackingCall, ...originalBody.body])
      }
    },

    ArrowFunctionExpression: (path: NodePath<t.ArrowFunctionExpression>) => {
      if (!shouldExclude(path.node)) {
        const trackingCall = createTrackingCall(path.node)

        if (t.isBlockStatement(path.node.body)) {
          const originalBody: t.BlockStatement = path.node.body
          path.node.body = t.blockStatement([trackingCall, ...originalBody.body])
        } else {
          // For concise arrow functions, wrap in block
          const originalExpression: t.Expression = path.node.body
          path.node.body = t.blockStatement([trackingCall, t.returnStatement(originalExpression)])
        }
      }
    },
  }

  return transformVisitor
}
