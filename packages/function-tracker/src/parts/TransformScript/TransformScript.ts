import * as t from '@babel/types'
import { createFunctionWrapperPlugin } from '../CreateFunctionWrapperPlugin/CreateFunctionWrapperPlugin.js'
import { generate2, parser2, traverse2 } from '../BabelHelpers/BabelHelpers.ts'

export const transformCode = async (code: string, filename?: string, excludePatterns?: string[]): Promise<string> => {
  try {
    // Try different parsing strategies
    const ast = parser2.parse(code, {
      sourceType: 'module',
      allowImportExportEverywhere: true,
      plugins: [],
    })

    // Transform the original code with proper file context
    try {
      const plugin = createFunctionWrapperPlugin({ filename, excludePatterns })
      console.log('Plugin created successfully:', plugin)
      console.log('AST before transformation:', ast)
      traverse2(ast, plugin as any)
      console.log('AST after transformation successful')
    } catch (error) {
      console.error('Error transforming code:', error)
      console.error('Error details:', error.message)
      console.error('Error stack:', error.stack)
      return code // Return original code if transformation fails
    }

    // Combine tracking code with transformed code
    const combinedAST = t.program(ast.program.body)

    const result = generate2(combinedAST, {
      retainLines: false,
      compact: false,
    })

    return result.code
  } catch (error) {
    console.error('Error transforming code:', error)
    return code // Return original code if transformation fails
  }
}
