import type { NodePath, Visitor } from '@babel/core'
import * as t from '@babel/types'

export interface CreateFunctionWrapperPluginOptions {
  readonly excludePatterns?: string[]
  readonly filename?: string
  readonly functionLocations?: Map<any, { line: number; column: number }>
  readonly preambleOffset?: number
  readonly scriptId?: number
}

export const createFunctionWrapperPlugin = (options: CreateFunctionWrapperPluginOptions): Visitor => {
  const { functionLocations = new Map(), scriptId = 123 } = options

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
    ArrowFunctionExpression: (path: NodePath<t.ArrowFunctionExpression>) => {
      const trackingCall = createTrackingCall(path.node)

      if (t.isBlockStatement(path.node.body)) {
        const originalBody: t.BlockStatement = path.node.body
        path.node.body = t.blockStatement([trackingCall, ...originalBody.body])
      } else {
        // For concise arrow functions, wrap in block
        const originalExpression: t.Expression = path.node.body
        path.node.body = t.blockStatement([trackingCall, t.returnStatement(originalExpression)])
      }
    },

    ClassMethod: (path: NodePath<t.ClassMethod>) => {
      const originalBody: t.BlockStatement = path.node.body
      const trackingCall = createTrackingCall(path.node)

      path.node.body = t.blockStatement([trackingCall, ...originalBody.body])
    },

    FunctionDeclaration: (path: NodePath<t.FunctionDeclaration>) => {
      // Wrap function body
      const originalBody: t.BlockStatement = path.node.body
      const trackingCall = createTrackingCall(path.node)

      path.node.body = t.blockStatement([trackingCall, ...originalBody.body])
    },

    FunctionExpression: (path: NodePath<t.FunctionExpression>) => {
      const originalBody: t.BlockStatement = path.node.body
      const trackingCall = createTrackingCall(path.node)

      path.node.body = t.blockStatement([trackingCall, ...originalBody.body])
    },

    ObjectMethod: (path: NodePath<t.ObjectMethod>) => {
      const originalBody: t.BlockStatement = path.node.body
      const trackingCall = createTrackingCall(path.node)

      path.node.body = t.blockStatement([trackingCall, ...originalBody.body])
    },
  }

  return transformVisitor
}
