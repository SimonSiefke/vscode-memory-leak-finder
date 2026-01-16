import babel from '@babel/core'
import parser from '@babel/parser'
import generate from '@babel/generator'
import * as t from '@babel/types'
import { TransformOptions, FunctionStatistics } from '../Types/Types.ts'
import { trackingCode } from '../TrackingCode/TrackingCode.ts'
import { createFunctionWrapperPlugin } from '../CreateFunctionWrapperPlugin/CreateFunctionWrapperPlugin.ts'

export async function transformCode(code: string, options: TransformOptions = {}): Promise<string> {
  try {
    const { filename = 'unknown' } = options
    
    // Dynamic import for traverse to avoid ES module issues
    const traverseModule = await import('@babel/traverse')
    const traverse = traverseModule.default
    
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'decorators-legacy']
    })
    
    // Add tracking code at the beginning
    const trackingAST = parser.parse(trackingCode, {
      sourceType: 'script'
    })
    
    // Transform the original code with proper file context
    const plugin = createFunctionWrapperPlugin(options)
    ;(traverse as any)(ast, plugin.visitor, undefined, ast)
    
    // Combine tracking code with transformed code
    const combinedAST = {
      type: 'Program',
      body: [...trackingAST.program.body, ...ast.program.body]
    }
    
    const result = (generate as any)(combinedAST, {
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
