import * as t from '@babel/types'
import type { PluginObj, NodePath } from '@babel/core'

export interface CreateFunctionWrapperPluginOptions {
  readonly filename?: string
  readonly excludePatterns?: string[]
}

export const createFunctionWrapperPlugin = (options: CreateFunctionWrapperPluginOptions = {}): PluginObj => {
  const { filename = 'unknown', excludePatterns = [] } = options

  return {
    visitor: {
      FunctionDeclaration(path: NodePath<t.FunctionDeclaration>) {
        const functionName: string = path.node.id ? path.node.id.name : 'anonymous'
        const hub = path.hub as any;
        const actualFilename = hub.file?.opts?.filename || filename || 'unknown';
        const location: string = `${actualFilename}:${path.node.loc?.start.line}`
        
        if (path.node.id && 
            !path.node.id.name.startsWith('track') &&
            !excludePatterns.some(pattern => functionName.includes(pattern))) {
          // Wrap the function body
          const originalBody: t.BlockStatement = path.node.body
          const trackingCall: t.ExpressionStatement = t.expressionStatement(
            t.callExpression(
              t.identifier('trackFunctionCall'),
              [
                t.stringLiteral(functionName),
                t.stringLiteral(location)
              ]
            )
          )
          
          path.node.body = t.blockStatement([
            trackingCall,
            ...originalBody.body
          ])
        }
      },
      
      FunctionExpression(path: NodePath<t.FunctionExpression>) {
        const parent: any = path.parent
        let functionName: string = 'anonymous'
        
        const hub = path.hub as any;
        const actualFilename = hub.file?.opts?.filename || filename || 'unknown';
        
        if (t.isVariableDeclarator(parent) && t.isIdentifier(parent.id) && parent.id.name) {
          functionName = parent.id.name
        } else if (t.isAssignmentExpression(parent) && t.isIdentifier(parent.left)) {
          functionName = parent.left.name
        } else if (t.isProperty(parent) && t.isIdentifier(parent.key)) {
          functionName = parent.key.name
        }
        
        const location: string = `${actualFilename}:${path.node.loc?.start.line}`
        
        if (!functionName.startsWith('track') &&
            !excludePatterns.some(pattern => functionName.includes(pattern))) {
          const originalBody: t.BlockStatement = path.node.body
          const trackingCall: t.ExpressionStatement = t.expressionStatement(
            t.callExpression(
              t.identifier('trackFunctionCall'),
              [
                t.stringLiteral(functionName),
                t.stringLiteral(location)
              ]
            )
          )
          
          path.node.body = t.blockStatement([
            trackingCall,
            ...originalBody.body
          ])
        }
      },
      
      ArrowFunctionExpression(path: NodePath<t.ArrowFunctionExpression>) {
        const parent: any = path.parent
        let functionName: string = 'anonymous_arrow'
        
        const hub = path.hub as any;
        const actualFilename = hub.file?.opts?.filename || filename || 'unknown';
        
        if (t.isVariableDeclarator(parent) && t.isIdentifier(parent.id) && parent.id.name) {
          functionName = parent.id.name
        } else if (t.isAssignmentExpression(parent) && t.isIdentifier(parent.left)) {
          functionName = parent.left.name
        } else if (t.isProperty(parent) && t.isIdentifier(parent.key)) {
          functionName = parent.key.name
        }
        
        const location: string = `${actualFilename}:${path.node.loc?.start.line}`
        
        if (!functionName.startsWith('track') &&
            !excludePatterns.some(pattern => functionName.includes(pattern))) {
          if (t.isBlockStatement(path.node.body)) {
            const originalBody: t.BlockStatement = path.node.body
            const trackingCall: t.ExpressionStatement = t.expressionStatement(
              t.callExpression(
                t.identifier('trackFunctionCall'),
                [
                  t.stringLiteral(functionName),
                  t.stringLiteral(location)
                ]
              )
            )
            
            path.node.body = t.blockStatement([
              trackingCall,
              ...originalBody.body
            ])
          } else {
            // For concise arrow functions, wrap in block
            const originalExpression: t.Expression = path.node.body
            const trackingCall: t.ExpressionStatement = t.expressionStatement(
              t.callExpression(
                t.identifier('trackFunctionCall'),
                [
                  t.stringLiteral(functionName),
                  t.stringLiteral(location)
                ]
              )
            )
            
            path.node.body = t.blockStatement([
              trackingCall,
              t.returnStatement(originalExpression)
            ])
          }
        }
      }
    }
  }
}
