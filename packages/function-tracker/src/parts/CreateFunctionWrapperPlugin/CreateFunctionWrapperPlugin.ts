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

  // Collect all function locations upfront before any modifications
  const functionLocations = new Map<any, { line: number; column: number }>()

  const createTrackingCall = (node: any) => {
    const location = functionLocations.get(node)
    const line = location ? location.line : (node.loc?.start.line || 1) - preambleOffset
    const column = location ? location.column : (node.loc?.start.column || 0)
    return t.expressionStatement(
      t.callExpression(t.identifier('trackFunctionCall'), [
        t.numericLiteral(scriptId),
        t.numericLiteral(line),
        t.numericLiteral(column),
      ]),
    )
  }

  const visitor: any = {
    // First pass: collect all function locations
    FunctionDeclaration: {
      enter(path: NodePath<t.FunctionDeclaration>) {
        if (!allExcludePatterns.some((pattern) => 'anonymous'.includes(pattern))) {
          functionLocations.set(path.node, {
            line: (path.node.loc?.start.line || 1) - preambleOffset,
            column: path.node.loc?.start.column || 0,
          })
        }
      }
    },
    FunctionExpression: {
      enter(path: NodePath<t.FunctionExpression>) {
        if (!allExcludePatterns.some((pattern) => 'anonymous'.includes(pattern))) {
          functionLocations.set(path.node, {
            line: (path.node.loc?.start.line || 1) - preambleOffset,
            column: path.node.loc?.start.column || 0,
          })
        }
      }
    },
    ObjectMethod: {
      enter(path: NodePath<t.ObjectMethod>) {
        if (!allExcludePatterns.some((pattern) => 'anonymous'.includes(pattern))) {
          functionLocations.set(path.node, {
            line: (path.node.loc?.start.line || 1) - preambleOffset,
            column: path.node.loc?.start.column || 0,
          })
        }
      }
    },
    ClassMethod: {
      enter(path: NodePath<t.ClassMethod>) {
        if (t.isIdentifier(path.node.key) && path.node.key.name === 'constructor') {
          return
        }
        if (!allExcludePatterns.some((pattern) => 'anonymous'.includes(pattern))) {
          functionLocations.set(path.node, {
            line: (path.node.loc?.start.line || 1) - preambleOffset,
            column: path.node.loc?.start.column || 0,
          })
        }
      }
    },
    ArrowFunctionExpression: {
      enter(path: NodePath<t.ArrowFunctionExpression>) {
        if (!allExcludePatterns.some((pattern) => 'anonymous_arrow'.includes(pattern))) {
          functionLocations.set(path.node, {
            line: (path.node.loc?.start.line || 1) - preambleOffset,
            column: path.node.loc?.start.column || 0,
          })
        }
      }
    },
  }

  // Second pass: add modification handlers
  visitor.FunctionDeclaration = (path: NodePath<t.FunctionDeclaration>) => {
    if (!allExcludePatterns.some((pattern) => 'anonymous'.includes(pattern))) {
      // Wrap function body
      const originalBody: t.BlockStatement = path.node.body
      const trackingCall = createTrackingCall(path.node)

      path.node.body = t.blockStatement([trackingCall, ...originalBody.body])
    }
  }

  visitor.FunctionExpression = (path: NodePath<t.FunctionExpression>) => {
    if (!allExcludePatterns.some((pattern) => 'anonymous'.includes(pattern))) {
      const originalBody: t.BlockStatement = path.node.body
      const trackingCall = createTrackingCall(path.node)

      path.node.body = t.blockStatement([trackingCall, ...originalBody.body])
    }
  }

  visitor.ObjectMethod = (path: NodePath<t.ObjectMethod>) => {
    if (!allExcludePatterns.some((pattern) => 'anonymous'.includes(pattern))) {
      const originalBody: t.BlockStatement = path.node.body
      const trackingCall = createTrackingCall(path.node)

      path.node.body = t.blockStatement([trackingCall, ...originalBody.body])
    }
  }

  visitor.ClassMethod = (path: NodePath<t.ClassMethod>) => {
    // Don't track constructors
    if (t.isIdentifier(path.node.key) && path.node.key.name === 'constructor') {
      return
    }

    if (!allExcludePatterns.some((pattern) => 'anonymous'.includes(pattern))) {
      const originalBody: t.BlockStatement = path.node.body
      const trackingCall = createTrackingCall(path.node)

      path.node.body = t.blockStatement([trackingCall, ...originalBody.body])
    }
  }

  visitor.ArrowFunctionExpression = (path: NodePath<t.ArrowFunctionExpression>) => {
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
  }

  return visitor
}
