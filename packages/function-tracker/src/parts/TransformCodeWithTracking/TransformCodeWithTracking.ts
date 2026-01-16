import parser from '@babel/parser'
import { TransformOptions } from '../Types/Types.js'
import { createFunctionWrapperPlugin } from '../CreateFunctionWrapperPlugin/CreateFunctionWrapperPlugin.js'

export const transformCodeWithTracking = async (code: string, options: TransformOptions = {}): Promise<string> => {
  try {
    // Dynamic imports for Babel modules to avoid ES module issues
    const [traverseModule, generateModule] = await Promise.all([
      import('@babel/traverse'),
      import('@babel/generator')
    ])
    const traverse = traverseModule.default
    const generate = generateModule.default
    
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
