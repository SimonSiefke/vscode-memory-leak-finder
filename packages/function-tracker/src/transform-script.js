import babel from '@babel/core'
import parser from '@babel/parser'
import traverse from '@babel/traverse'
import generate from '@babel/generator'
import * as t from '@babel/types'

// Function call tracking infrastructure
const trackingCode = `
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

function createFunctionWrapperPlugin(filename) {
  return {
    visitor: {
      FunctionDeclaration(path) {
        const functionName = path.node.id ? path.node.id.name : 'anonymous'
        const location = `${filename || 'unknown'}:${path.node.loc?.start.line}`
        
        if (path.node.id && !path.node.id.name.startsWith('track')) {
          // Wrap the function body
          const originalBody = path.node.body
          const trackingCall = t.expressionStatement(
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
      
      FunctionExpression(path) {
        const parent = path.parent
        let functionName = 'anonymous'
        
        if (t.isVariableDeclarator(parent) && parent.id.name) {
          functionName = parent.id.name
        } else if (t.isAssignmentExpression(parent) && t.isIdentifier(parent.left)) {
          functionName = parent.left.name
        } else if (t.isProperty(parent) && parent.key.name) {
          functionName = parent.key.name
        }
        
        const location = `${filename || 'unknown'}:${path.node.loc?.start.line}`
        
        if (!functionName.startsWith('track')) {
          const originalBody = path.node.body
          const trackingCall = t.expressionStatement(
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
      
      ArrowFunctionExpression(path) {
        const parent = path.parent
        let functionName = 'anonymous_arrow'
        
        if (t.isVariableDeclarator(parent) && parent.id.name) {
          functionName = parent.id.name
        } else if (t.isAssignmentExpression(parent) && t.isIdentifier(parent.left)) {
          functionName = parent.left.name
        } else if (t.isProperty(parent) && parent.key.name) {
          functionName = parent.key.name
        }
        
        const location = `${filename || 'unknown'}:${path.node.loc?.start.line}`
        
        if (!functionName.startsWith('track')) {
          if (t.isBlockStatement(path.node.body)) {
            const originalBody = path.node.body
            const trackingCall = t.expressionStatement(
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
            const originalExpression = path.node.body
            const trackingCall = t.expressionStatement(
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

export function transformCode(code, filename) {
  try {
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'decorators-legacy']
    })
    
    // Add tracking code at the beginning
    const trackingAST = parser.parse(trackingCode, {
      sourceType: 'script'
    })
    
    // Transform the original code with proper file context
    const plugin = createFunctionWrapperPlugin(filename)
    traverse.default(ast, plugin.visitor, null, ast)
    
    // Combine tracking code with transformed code
    const combinedAST = {
      type: 'Program',
      body: [...trackingAST.program.body, ...ast.program.body]
    }
    
    const result = generate.default(combinedAST, {
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
