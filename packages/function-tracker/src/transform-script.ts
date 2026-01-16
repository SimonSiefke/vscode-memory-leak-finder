import babel from '@babel/core'
import parser from '@babel/parser'
import * as traverse from '@babel/traverse'
import generate from '@babel/generator'
import * as t from '@babel/types'

const traverseDefault = (traverse as any).default || traverse
const generateDefault = (generate as any).default || generate

interface FunctionStatistics {
  readonly [key: string]: number;
}

declare global {
  var ___functionStatistics: Map<string, number> | undefined;
  var getFunctionStatistics: (() => FunctionStatistics) | undefined;
  var resetFunctionStatistics: (() => void) | undefined;
}

// Function call tracking infrastructure
const trackingCode: string = `
// Function call tracking system
if (!globalThis.___functionStatistics) {
  globalThis.___functionStatistics = new Map()
}

function trackFunctionCall(functionName, location) {
  const key = functionName + (location ? \` (\${location})\` : '')
  const current = globalThis.___functionStatistics.get(key) || 0
  globalThis.___functionStatistics.set(key, current + 1)
}

function getFunctionStatistics() {
  const stats = {}
  for (const [name, count] of globalThis.___functionStatistics) {
    stats[name] = count
  }
  return stats
}

function resetFunctionStatistics() {
  globalThis.___functionStatistics.clear()
}

// Export for debugging
globalThis.getFunctionStatistics = getFunctionStatistics
globalThis.resetFunctionStatistics = resetFunctionStatistics
`

function createFunctionWrapperPlugin(filename?: string): babel.PluginObj {
  return {
    visitor: {
      FunctionDeclaration(path: babel.NodePath<t.FunctionDeclaration>) {
        const functionName: string = path.node.id ? path.node.id.name : 'anonymous'
        const hub = path.hub as any;
        const actualFilename = hub.file?.opts?.filename || filename || 'unknown';
        const location: string = `${actualFilename}:${path.node.loc?.start.line}`
        
        if (path.node.id && !path.node.id.name.startsWith('track')) {
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
      
      FunctionExpression(path: babel.NodePath<t.FunctionExpression>) {
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
        
        if (!functionName.startsWith('track')) {
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
      
      ArrowFunctionExpression(path: babel.NodePath<t.ArrowFunctionExpression>) {
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
        
        if (!functionName.startsWith('track')) {
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

export function transformCode(code: string, filename?: string): string {
  try {
    // Try parsing as module first, then fallback to script
    let ast
    try {
      ast = parser.parse(code, {
        sourceType: 'unambiguous',  // Let Babel decide
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        allowHashBang: true,
        plugins: [
          'jsx', 
          'typescript', 
          'decorators-legacy', 
          'objectRestSpread', 
          'classProperties', 
          'asyncGenerators', 
          'functionBind', 
          'exportDefaultFrom', 
          'exportNamespaceFrom', 
          'dynamicImport', 
          'nullishCoalescingOperator', 
          'optionalChaining',
          'bigInt',
          'optionalCatchBinding',
          'throwExpressions',
          'pipelineOperator',
          'numericSeparator',
          'logicalAssignment',
          'classPrivateProperties',
          'classPrivateMethods'
        ]
      })
    } catch (error) {
      console.error('Parser error:', error.message)
      // Try with flow parser which is more permissive
      try {
        ast = parser.parse(code, {
          sourceType: 'script',
          allowImportExportEverywhere: true,
          allowReturnOutsideFunction: true,
          allowHashBang: true,
          plugins: ['flow', 'flowComments', 'jsx', 'typescript']
        })
      } catch (flowError) {
        console.error('Flow parser also failed:', flowError.message)
        throw flowError
      }
    }
    
    // Add tracking code at the beginning
    const trackingAST = parser.parse(trackingCode, {
      sourceType: 'script'
    })
    
    // Transform the original code with proper file context
    try {
      const plugin = createFunctionWrapperPlugin(filename)
      traverseDefault(ast, plugin.visitor)
    } catch (error) {
      console.error('Error transforming code:', error)
      return code // Return original code if transformation fails
    }
    
    // Combine tracking code with transformed code
    const combinedAST = t.program([...trackingAST.program.body, ...ast.program.body])
    
    const result = generateDefault(combinedAST, {
      retainLines: false,
      compact: false
    })
    
    return result.code
  } catch (error) {
    console.error('Error transforming code:', error)
    return code // Return original code if transformation fails
  }
}

export {
  createFunctionWrapperPlugin
}
