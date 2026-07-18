import { VError } from '@lvce-editor/verror'
import type { TransformOptions } from '../Types/Types.ts'
import { generate2, parser2, traverse2 } from '../BabelHelpers/BabelHelpers.ts'
import { createEverythingWrapperPlugin } from '../CreateEverythingWrapperPlugin/CreateEverythingWrapperPlugin.ts'

export const transformCodeWithEverythingTracking = (code: string, options: TransformOptions = {}): string => {
  if (!code) {
    return ''
  }
  const { filename = '', minify = false, scriptId = filename || 123 } = options
  try {
    const ast = parser2.parse(code, {
      plugins: [],
      ranges: false,
      sourceType: 'module',
      tokens: false,
    })
    traverse2(ast, createEverythingWrapperPlugin({ scriptId }))
    return generate2(ast, {
      comments: true,
      compact: false,
      jsonCompatibleStrings: false,
      minified: minify,
      retainLines: false,
    }).code
  } catch (error) {
    throw new VError(error, `Error transforming code with everything tracking:`)
  }
}
