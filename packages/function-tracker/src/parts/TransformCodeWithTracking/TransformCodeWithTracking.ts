import type { TransformOptions } from '../Types/Types.ts'
import { createFunctionWrapperPlugin } from '../CreateFunctionWrapperPlugin/CreateFunctionWrapperPlugin.ts'
import { getFunctionLocations } from '../GetFunctionLocations/GetFunctionLocations.ts'
import { VError } from '@lvce-editor/verror'
import { generate2, parser2, traverse2 } from '../BabelHelpers/BabelHelpers.ts'

export const transformCodeWithTracking = (code: string, options: TransformOptions = {}): string => {
  // Handle null/undefined input
  if (!code) {
    return 'Function call tracking system'
  }

  try {
    // First pass: parse AST and collect original function locations
    const originalAst = parser2.parse(code, {
      sourceType: 'module',
      plugins: [],
    })

    const functionLocations = getFunctionLocations(originalAst)

    // Second pass: parse fresh AST for transformation to avoid location contamination
    const transformAst = parser2.parse(code, {
      sourceType: 'module',
      plugins: [],
    })

    const plugin = createFunctionWrapperPlugin({ ...options, functionLocations })
    traverse2(transformAst, plugin)

    const result = generate2(transformAst, {
      retainLines: false,
      compact: false,
      comments: true,
      minified: false,
      jsonCompatibleStrings: false,
    })

    return result.code
  } catch (error) {
    throw new VError(error, `Error transforming code with tracking:`)
  }
}
