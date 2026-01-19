import type { TransformOptions } from '../Types/Types.ts'
import { createFunctionWrapperPlugin } from '../CreateFunctionWrapperPlugin/CreateFunctionWrapperPlugin.ts'
import { getFunctionLocations } from '../GetFunctionLocations/GetFunctionLocations.ts'
import { VError } from '@lvce-editor/verror'
import { generate2, parser2, traverse2 } from '../BabelHelpers/BabelHelpers.ts'

export const transformCodeWithTracking = (code: string, options: TransformOptions = {}): string => {
  if (!code) {
    return ''
  }

<<<<<<< HEAD
  const { scriptId = 123, minify = false, ...restOptions } = options
=======
  const { scriptId = 123, ...restOptions } = options
>>>>>>> origin/main

  try {
    const originalAst = parser2.parse(code, {
      sourceType: 'module',
      plugins: [],
    })

    const functionLocations = getFunctionLocations(originalAst)

    const plugin = createFunctionWrapperPlugin({ ...restOptions, functionLocations, scriptId })
    traverse2(originalAst, plugin)

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
