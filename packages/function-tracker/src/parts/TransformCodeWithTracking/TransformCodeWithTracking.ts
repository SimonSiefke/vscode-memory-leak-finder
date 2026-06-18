import { VError } from '@lvce-editor/verror'
import type { TransformOptions } from '../Types/Types.ts'
import { generate2, parser2, traverse2 } from '../BabelHelpers/BabelHelpers.ts'
import { createFunctionWrapperPlugin } from '../CreateFunctionWrapperPlugin/CreateFunctionWrapperPlugin.ts'
import { getFunctionLocations } from '../GetFunctionLocations/GetFunctionLocations.ts'

export const transformCodeWithTracking = (code: string, options: TransformOptions = {}): string => {
  if (!code) {
    return ''
  }

  const { minify = false, scriptId = 123, ...restOptions } = options

  try {
    // Optimize parser options to reduce memory usage:
    // - tokens: false - don't store token information
    // - ranges: false - don't store range information (we only need loc)
    // - attachComments: false - don't attach comments to nodes (saves memory)
    const originalAst = parser2.parse(code, {
      plugins: [],
      ranges: false,
      sourceType: 'module',
      tokens: false,
    })

    // Must collect locations BEFORE mutating AST, as mutations change node locations
    const functionLocations = getFunctionLocations(originalAst)

    const plugin = createFunctionWrapperPlugin({ ...restOptions, functionLocations, scriptId })
    traverse2(originalAst, plugin)

    // Clear functionLocations map to help GC (though it will be GC'd when function returns anyway)
    functionLocations.clear()

    const result = generate2(originalAst, {
      comments: true,
      compact: false,
      jsonCompatibleStrings: false,
      minified: minify,
      retainLines: false,
    })

    return result.code
  } catch (error) {
    throw new VError(error, `Error transforming code with tracking:`)
  }
}
