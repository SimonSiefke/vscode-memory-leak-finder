import parser from '@babel/parser'
import traverse from '@babel/traverse'
import generate from '@babel/generator'
import * as t from '@babel/types'
import { trackingCode } from '../TrackingCode/TrackingCode.ts'
import { createFunctionWrapperPlugin } from '../CreateFunctionWrapperPlugin/CreateFunctionWrapperPlugin.ts'

// Handle ESM imports properly
const traverseDefault = (traverse as any).default || traverse
const generateDefault = (generate as any).default || generate

export const transformCode = async (code: string, filename?: string, excludePatterns?: string[]): Promise<string> => {
  try {
    // Try different parsing strategies
    const ast = parser.parse(code, {
      sourceType: 'module',
      allowImportExportEverywhere: true,
      plugins: [],
    })

    // Add tracking code at the beginning
    const trackingAST = parser.parse(trackingCode, {
      sourceType: 'script',
    })

    // Transform the original code with proper file context
    try {
      const plugin = createFunctionWrapperPlugin({ filename, excludePatterns })
      console.log('Plugin created successfully:', plugin)
      console.log('AST before transformation:', ast)
      traverseDefault(ast, plugin.visitor as any)
      console.log('AST after transformation successful')
    } catch (error) {
      console.error('Error transforming code:', error)
      console.error('Error details:', error.message)
      console.error('Error stack:', error.stack)
      return code // Return original code if transformation fails
    }

    // Combine tracking code with transformed code
    const combinedAST = t.program([...trackingAST.program.body, ...ast.program.body])

    const result = generateDefault(combinedAST, {
      retainLines: false,
      compact: false,
    })

    return result.code
  } catch (error) {
    console.error('Error transforming code:', error)
    return code // Return original code if transformation fails
  }
}

export { createFunctionWrapperPlugin }
