import type { TransformOptions } from '../Types/Types.ts'
import { createFunctionWrapperPlugin } from '../CreateFunctionWrapperPlugin/CreateFunctionWrapperPlugin.ts'
import { getFunctionLocations } from '../GetFunctionLocations/GetFunctionLocations.ts'
import { VError } from '@lvce-editor/verror'
import { generate2, parser2, traverse2 } from '../BabelHelpers/BabelHelpers.ts'

export const transformCodeWithTracking = (code: string, options: TransformOptions = {}): string => {
  if (!code) {
    return ''
  }

  const { scriptId = 123, minify = false, ...restOptions } = options

  try {
    // Optimize parser options to reduce memory usage:
    // - tokens: false - don't store token information
    // - ranges: false - don't store range information (we only need loc)
    // - attachComments: false - don't attach comments to nodes (saves memory)
    const originalAst = parser2.parse(code, {
      sourceType: 'module',
      plugins: [],
      tokens: false,
      ranges: false,
    })

    // Must collect locations BEFORE mutating AST, as mutations change node locations
    const functionLocations = getFunctionLocations(originalAst)

    const plugin = createFunctionWrapperPlugin({ ...restOptions, functionLocations, scriptId })
    traverse2(originalAst, plugin)

    // Clear functionLocations map to help GC (though it will be GC'd when function returns anyway)
    functionLocations.clear()

    const result = generate2(originalAst, {
      retainLines: false,
      compact: false,
      comments: true,
      minified: minify,
      jsonCompatibleStrings: false,
    })

    return result.code
  } catch (error) {
    throw new VError(error, `Error transforming code with tracking:`)
  }
}
