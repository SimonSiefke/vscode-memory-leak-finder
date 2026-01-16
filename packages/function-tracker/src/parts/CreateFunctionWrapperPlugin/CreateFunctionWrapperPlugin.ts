import type { NodePath, Visitor } from '@babel/core'
import * as t from '@babel/types'

export interface CreateFunctionWrapperPluginOptions {
  readonly scriptId?: number
  readonly filename?: string
  readonly excludePatterns?: string[]
  readonly preambleOffset?: number
}

export const createFunctionWrapperPlugin = (options: CreateFunctionWrapperPluginOptions): Visitor => {
  const { scriptId = 123, excludePatterns = [] } = options

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

  // Collect all function locations upfront before any modifications
  const functionLocations = new Map<any, { line: number; column: number }>()

  const createTrackingCall = (node: any) => {
    const location = functionLocations.get(node)
    // Use fixed location (2, 5) for consistency with existing tests
    // when preambleOffset is 0 or undefined
    const line = location ? location.line : (node.loc?.start.line || 1) - 0
    const column = location ? location.column : node.loc?.start.column || 0
    return t.expressionStatement(
      t.callExpression(t.identifier('trackFunctionCall'), [t.numericLiteral(scriptId), t.numericLiteral(line), t.numericLiteral(column)]),
    )
  }

  const visitor: any = {
    // First pass: collect all function locations
    FunctionDeclaration: {
      enter(path: NodePath<t.FunctionDeclaration>) {
        if (!shouldExclude(path.node)) {
          functionLocations.set(path.node, {
            line: path.node.loc?.start.line || 1,
            column: path.node.loc?.start.column || 0,
          })
        }
      },
    },
    FunctionExpression: {
      enter(path: NodePath<t.FunctionExpression>) {
        if (!shouldExclude(path.node)) {
          functionLocations.set(path.node, {
            line: path.node.loc?.start.line || 1,
            column: path.node.loc?.start.column || 0,
          })
        }
      },
    },
    ObjectMethod: {
      enter(path: NodePath<t.ObjectMethod>) {
        if (!shouldExclude(path.node)) {
          functionLocations.set(path.node, {
            line: path.node.loc?.start.line || 1,
            column: path.node.loc?.start.column || 0,
          })
        }
      },
    },
    ClassMethod: {
      enter(path: NodePath<t.ClassMethod>) {
        if (t.isIdentifier(path.node.key) && path.node.key.name === 'constructor') {
          return
        }
        if (!shouldExclude(path.node)) {
          functionLocations.set(path.node, {
            line: path.node.loc?.start.line || 1,
            column: path.node.loc?.start.column || 0,
          })
        }
      },
    },
    ArrowFunctionExpression: {
      enter(path: NodePath<t.ArrowFunctionExpression>) {
        if (!shouldExclude(path.node)) {
          functionLocations.set(path.node, {
            line: path.node.loc?.start.line || 1,
            column: path.node.loc?.start.column || 0,
          })
        }
      },
    },
  }

  // Second pass: add modification handlers
  visitor.FunctionDeclaration = (path: NodePath<t.FunctionDeclaration>) => {
    if (!shouldExclude(path.node)) {
      // Wrap function body
      const originalBody: t.BlockStatement = path.node.body
      const trackingCall = createTrackingCall(path.node)

      path.node.body = t.blockStatement([trackingCall, ...originalBody.body])
    }
  }

  visitor.FunctionExpression = (path: NodePath<t.FunctionExpression>) => {
    if (!shouldExclude(path.node)) {
      const originalBody: t.BlockStatement = path.node.body
      const trackingCall = createTrackingCall(path.node)

      path.node.body = t.blockStatement([trackingCall, ...originalBody.body])
    }
  }

  visitor.ObjectMethod = (path: NodePath<t.ObjectMethod>) => {
    if (!shouldExclude(path.node)) {
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

    if (!shouldExclude(path.node)) {
      const originalBody: t.BlockStatement = path.node.body
      const trackingCall = createTrackingCall(path.node)

      path.node.body = t.blockStatement([trackingCall, ...originalBody.body])
    }
  }

  visitor.ArrowFunctionExpression = (path: NodePath<t.ArrowFunctionExpression>) => {
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
  }

  return visitor
}
