import parser from '@babel/parser'
import traverse from '@babel/traverse'
import generate from '@babel/generator'
import * as t from '@babel/types'
import { trackingCode } from '../TrackingCode/TrackingCode.ts'
import { createFunctionWrapperPlugin } from '../CreateFunctionWrapperPlugin/CreateFunctionWrapperPlugin.js'

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
      const pluginOptions: any = {}
      if (filename !== undefined) {
        pluginOptions.filename = filename
      }
      if (excludePatterns !== undefined) {
        pluginOptions.excludePatterns = excludePatterns
      }
      const plugin = createFunctionWrapperPlugin(pluginOptions)
      console.log('Plugin created successfully:', plugin)
      console.log('AST before transformation:', ast)
      traverseDefault(ast, plugin as any)
      console.log('AST after transformation successful')
    } catch (error) {
      console.error('Error transforming code:', error)
      console.error('Error details:', (error as Error).message)
      console.error('Error stack:', (error as Error).stack)
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
