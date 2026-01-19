import * as t from '@babel/types'
import { createFunctionWrapperPlugin } from '../CreateFunctionWrapperPlugin/CreateFunctionWrapperPlugin.ts'
import { generate2, parser2, traverse2 } from '../BabelHelpers/BabelHelpers.ts'

export const transformCode = async (code: string, filename?: string, excludePatterns?: string[]): Promise<string> => {
  try {
    // Try different parsing strategies
    const ast = parser2.parse(code, {
      sourceType: 'module',
      plugins: [],
    })

    // Transform the original code with proper file context
    const plugin = createFunctionWrapperPlugin({ filename, excludePatterns })
    traverse2(ast, plugin)

    const result = generate2(ast, {
      retainLines: false,
      compact: false,
    })

    return result.code
  } catch (error) {
    console.error('Error transforming code:', error)
    return code // Return original code if transformation fails
  }
}
