import * as t from '@babel/types'
import { createFunctionWrapperPlugin } from '../CreateFunctionWrapperPlugin/CreateFunctionWrapperPlugin.ts'
import { generate2, parser2, traverse2 } from '../BabelHelpers/BabelHelpers.ts'

export const transformCode = async (code: string, filename?: string, minify?: boolean): Promise<string> => {
  try {
    // Try different parsing strategies
    const ast = parser2.parse(code, {
      sourceType: 'module',
      plugins: [],
    })

    // Transform the original code with proper file context
    const plugin = createFunctionWrapperPlugin({ filename })
    traverse2(ast, plugin)

    const result = generate2(ast, {
      retainLines: false,
      minified: minify,
    })

    return result.code
  } catch (error) {
    console.error('Error transforming code:', error)
    return code // Return original code if transformation fails
  }
}
