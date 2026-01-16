import type { NodePath, Visitor } from '@babel/core'
import * as t from '@babel/types'

export interface CreateFunctionWrapperPluginOptions {
  readonly filename?: string
  readonly excludePatterns?: string[]
}

export const createFunctionWrapperPlugin = (options: CreateFunctionWrapperPluginOptions = {}): Visitor => {
  const { filename = 'unknown', excludePatterns = [] } = options

  return {
    FunctionDeclaration(path: NodePath<t.FunctionDeclaration>) {
      const functionName: string = path.node.id ? path.node.id.name : 'anonymous'
      const actualFilename = filename || 'unknown'
      const location: string = `${actualFilename}:${path.node.loc?.start.line}`

      if (path.node.id && !path.node.id.name.startsWith('track') && !excludePatterns.some((pattern) => functionName.includes(pattern))) {
        // Wrap the function body
        const originalBody: t.BlockStatement = path.node.body
        const trackingCall: t.ExpressionStatement = t.expressionStatement(
          t.callExpression(t.identifier('trackFunctionCall'), [t.stringLiteral(functionName), t.stringLiteral(location)]),
        )

        path.node.body = t.blockStatement([trackingCall, ...originalBody.body])
      }
    },

    FunctionExpression(path: NodePath<t.FunctionExpression>) {
      const parent: any = path.parent
      let functionName: string = 'anonymous'

      const actualFilename = filename || 'unknown'

      if (t.isVariableDeclarator(parent) && t.isIdentifier(parent.id) && parent.id.name) {
        functionName = parent.id.name
      } else if (t.isAssignmentExpression(parent) && t.isIdentifier(parent.left)) {
        functionName = parent.left.name
      } else if (t.isProperty(parent) && t.isIdentifier(parent.key)) {
        functionName = parent.key.name
      } else if (t.isReturnStatement(parent)) {
        // Check if this is a named function in a return statement
        if (path.node.id && path.node.id.name) {
          functionName = path.node.id.name
        }
      }

      const location: string = `${actualFilename}:${path.node.loc?.start.line}`

      if (!functionName.startsWith('track') && !excludePatterns.some((pattern) => functionName.includes(pattern))) {
        const originalBody: t.BlockStatement = path.node.body
        const trackingCall: t.ExpressionStatement = t.expressionStatement(
          t.callExpression(t.identifier('trackFunctionCall'), [t.stringLiteral(functionName), t.stringLiteral(location)]),
        )

        path.node.body = t.blockStatement([trackingCall, ...originalBody.body])
      }
    },

    ObjectMethod(path: NodePath<t.ObjectMethod>) {
      const methodName: string = t.isIdentifier(path.node.key) && path.node.key.name ? path.node.key.name : 'anonymous'
      const actualFilename = filename || 'unknown'
      const location: string = `${actualFilename}:${path.node.loc?.start.line}`

      // Don't track methods matching exclude patterns
      if (
        methodName.startsWith('track') ||
        excludePatterns.some((pattern) => methodName.includes(pattern))
      ) {
        return
      }

      const originalBody: t.BlockStatement = path.node.body
      const trackingCall: t.ExpressionStatement = t.expressionStatement(
        t.callExpression(t.identifier('trackFunctionCall'), [t.stringLiteral(methodName), t.stringLiteral(location)]),
      )

      path.node.body = t.blockStatement([trackingCall, ...originalBody.body])
    },

    ClassMethod(path: NodePath<t.ClassMethod>) {
      const methodName: string = t.isIdentifier(path.node.key) && path.node.key.name ? path.node.key.name : 'anonymous'
      const actualFilename = filename || 'unknown'
      const location: string = `${actualFilename}:${path.node.loc?.start.line}`

      // Don't track constructors or methods matching exclude patterns
      if (
        methodName === 'constructor' ||
        methodName.startsWith('track') ||
        excludePatterns.some((pattern) => methodName.includes(pattern))
      ) {
        return
      }

      const originalBody: t.BlockStatement = path.node.body
      const trackingCall: t.ExpressionStatement = t.expressionStatement(
        t.callExpression(t.identifier('trackFunctionCall'), [t.stringLiteral(methodName), t.stringLiteral(location)]),
      )

      path.node.body = t.blockStatement([trackingCall, ...originalBody.body])
    },

    ArrowFunctionExpression(path: NodePath<t.ArrowFunctionExpression>) {
      const parent: any = path.parent
      let functionName: string = 'anonymous_arrow'

      const actualFilename = filename || 'unknown'

      if (t.isVariableDeclarator(parent) && t.isIdentifier(parent.id) && parent.id.name) {
        functionName = parent.id.name
      } else if (t.isAssignmentExpression(parent) && t.isIdentifier(parent.left)) {
        functionName = parent.left.name
      } else if (t.isProperty(parent) && t.isIdentifier(parent.key)) {
        functionName = parent.key.name
      }

      const location: string = `${actualFilename}:${path.node.loc?.start.line}`

      if (!functionName.startsWith('track') && !excludePatterns.some((pattern) => functionName.includes(pattern))) {
        if (t.isBlockStatement(path.node.body)) {
          const originalBody: t.BlockStatement = path.node.body
          const trackingCall: t.ExpressionStatement = t.expressionStatement(
            t.callExpression(t.identifier('trackFunctionCall'), [t.stringLiteral(functionName), t.stringLiteral(location)]),
          )

          path.node.body = t.blockStatement([trackingCall, ...originalBody.body])
        } else {
          // For concise arrow functions, wrap in block
          const originalExpression: t.Expression = path.node.body
          const trackingCall: t.ExpressionStatement = t.expressionStatement(
            t.callExpression(t.identifier('trackFunctionCall'), [t.stringLiteral(functionName), t.stringLiteral(location)]),
          )

          path.node.body = t.blockStatement([trackingCall, t.returnStatement(originalExpression)])
        }
      }
    },
  }
}
