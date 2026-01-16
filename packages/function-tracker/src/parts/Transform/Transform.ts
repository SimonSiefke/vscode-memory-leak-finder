import parser from '@babel/parser'
import generate from '@babel/generator'
import { TransformOptions } from '../Types/Types.js'
import { trackingCode } from '../TrackingCode/TrackingCode.js'
import { createFunctionWrapperPlugin } from '../CreateFunctionWrapperPlugin/CreateFunctionWrapperPlugin.js'

export const addTrackingPreamble = async (code: string): Promise<string> => {
  try {
    // Parse the tracking code
    const trackingAST = parser.parse(trackingCode, {
      sourceType: 'script'
    })
    
    // Parse the original code
    const originalAST = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'decorators-legacy']
    })
    
    // Combine tracking code with original code
    const combinedAST = {
      type: 'Program',
      body: [...trackingAST.program.body, ...originalAST.program.body]
    }
    
    const result = (generate as any)(combinedAST, {
      retainLines: false,
      compact: false
    })
    
    return result.code
  } catch (error) {
    console.error('Error adding tracking preamble:', error)
    return code // Return original code if preamble addition fails
  }
}

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

export const transformCode = async (code: string, options: TransformOptions = {}): Promise<string> => {
  // First add the tracking preamble, then transform the functions
  const codeWithPreamble = await addTrackingPreamble(code)
  const transformedCode = await transformCodeWithTracking(codeWithPreamble, options)
  return transformedCode
}

export {
  createFunctionWrapperPlugin
}
