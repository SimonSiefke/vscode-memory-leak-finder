import parser from '@babel/parser'
import generate from '@babel/generator'
import { TransformOptions } from '../Types/Types.js'
import { createFunctionWrapperPlugin } from '../CreateFunctionWrapperPlugin/CreateFunctionWrapperPlugin.js'

export const transformCodeWithTracking = async (code: string, options: TransformOptions = {}): Promise<string> => {
  try {
    // Dynamic import for traverse to avoid ES module issues
    const traverseModule = await import('@babel/traverse')
    const traverse = traverseModule.default
    
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'decorators-legacy']
    })
    
    // Transform the original code with proper file context
    const plugin = createFunctionWrapperPlugin(options)
    ;(traverse as any)(ast, plugin.visitor, undefined, ast)
    
    const result = (generate as any)(ast, {
      retainLines: false,
      compact: false
    })
    
    return result.code
  } catch (error) {
    console.error('Error transforming code with tracking:', error)
    return code // Return original code if transformation fails
  }
}
