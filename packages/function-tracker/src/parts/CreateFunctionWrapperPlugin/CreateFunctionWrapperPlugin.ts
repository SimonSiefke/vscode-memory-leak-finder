import type { NodePath, Visitor } from '@babel/core'
import * as t from '@babel/types'

export interface CreateFunctionWrapperPluginOptions {
  readonly scriptId: number
  readonly excludePatterns?: string[]
  readonly preambleOffset?: number
}

export const createFunctionWrapperPlugin = (options: CreateFunctionWrapperPluginOptions): Visitor => {
  const { scriptId, excludePatterns = [], preambleOffset = 0 } = options

  // Add tracking system functions to exclude patterns
  const allExcludePatterns = [...excludePatterns, 'getFunctionStatistics', 'resetFunctionStatistics']

  const createTrackingCall = (node: any) => {
    const line = (node.loc?.start.line || 1) - preambleOffset
    const column = node.loc?.start.column || 0
    return t.expressionStatement(
      t.callExpression(t.identifier('trackFunctionCall'), [
        t.numericLiteral(scriptId),
        t.numericLiteral(line),
        t.numericLiteral(column),
      ]),
    )
  }

  return {
    FunctionDeclaration(path: NodePath<t.FunctionDeclaration>) {
      if (!allExcludePatterns.some((pattern) => 'anonymous'.includes(pattern))) {
        // Wrap function body
        const originalBody: t.BlockStatement = path.node.body
        const trackingCall = createTrackingCall(path.node)

        path.node.body = t.blockStatement([trackingCall, ...originalBody.body])
      }
    },

    FunctionExpression(path: NodePath<t.FunctionExpression>) {
      if (!allExcludePatterns.some((pattern) => 'anonymous'.includes(pattern))) {
        const originalBody: t.BlockStatement = path.node.body
        const trackingCall = createTrackingCall(path.node)

        path.node.body = t.blockStatement([trackingCall, ...originalBody.body])
      }
    },

    ObjectMethod(path: NodePath<t.ObjectMethod>) {
      if (!allExcludePatterns.some((pattern) => 'anonymous'.includes(pattern))) {
        const originalBody: t.BlockStatement = path.node.body
        const trackingCall = createTrackingCall(path.node)

        path.node.body = t.blockStatement([trackingCall, ...originalBody.body])
      }
    },

    ClassMethod(path: NodePath<t.ClassMethod>) {
      // Don't track constructors
      if (t.isIdentifier(path.node.key) && path.node.key.name === 'constructor') {
        return
      }

      if (!allExcludePatterns.some((pattern) => 'anonymous'.includes(pattern))) {
        const originalBody: t.BlockStatement = path.node.body
        const trackingCall = createTrackingCall(path.node)

        path.node.body = t.blockStatement([trackingCall, ...originalBody.body])
      }
    },

    ArrowFunctionExpression(path: NodePath<t.ArrowFunctionExpression>) {
      if (!allExcludePatterns.some((pattern) => 'anonymous_arrow'.includes(pattern))) {
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
}
