import parser from '@babel/parser'
import traverse from '@babel/traverse'
import generate from '@babel/generator'
import { TransformOptions } from '../Types/Types.js'
import { createFunctionWrapperPlugin } from '../CreateFunctionWrapperPlugin/CreateFunctionWrapperPlugin.js'

// @ts-ignore
const parser2 = (parser.default || parser) as typeof import('@babel/parser')
const traverse2 = (traverse.default || traverse) as typeof import('@babel/traverse').default
const generate2 = (generate.default || generate) as typeof import('@babel/generator').default

export const transformCodeWithTracking = (code: string, options: TransformOptions = {}): string => {
  try {
    const ast = parser2.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'decorators-legacy'],
    })

    const plugin = createFunctionWrapperPlugin(options)
    traverse2(ast, plugin)

    const result = generate2(ast, {
      retainLines: false,
      compact: false,
      comments: true,
      minified: false,
      jsonCompatibleStrings: false,
    })

    return result.code
  } catch (error) {
    console.error('Error transforming code with tracking:', error)
    return code // Return original code if transformation fails
  }
}
