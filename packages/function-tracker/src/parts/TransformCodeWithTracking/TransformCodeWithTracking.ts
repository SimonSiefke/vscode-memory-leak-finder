import parser from '@babel/parser'
import traverse from '@babel/traverse'
import generate from '@babel/generator'
import { TransformOptions } from '../Types/Types.js'
import { createFunctionWrapperPlugin } from '../CreateFunctionWrapperPlugin/CreateFunctionWrapperPlugin.js'

export const transformCodeWithTracking = async (code: string, options: TransformOptions = {}): Promise<string> => {
  try {
    
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'decorators-legacy']
    })
    
    // Transform the original code with proper file context
    const plugin = createFunctionWrapperPlugin(options)
    traverse.default(ast, plugin.visitor, undefined, ast)
    
    const result = generate.default(ast, {
      retainLines: false,
      compact: false,
      comments: true,
      minified: false,
      jsonCompatibleStrings: false
    } as any)
    
    return result.code
  } catch (error) {
    console.error('Error transforming code with tracking:', error)
    return code // Return original code if transformation fails
  }
}
