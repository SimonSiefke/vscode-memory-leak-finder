import { VError } from '@lvce-editor/verror'
import type { TransformOptions } from '../Types/Types.ts'
import { generate2, parser2, traverse2 } from '../BabelHelpers/BabelHelpers.ts'
import { createAllocationWrapperPlugin } from '../CreateAllocationWrapperPlugin/CreateAllocationWrapperPlugin.ts'

const collectAllocationLocations = (
  ast: any,
  includeGeneratedLocation?: (line: number, column: number) => boolean,
): Map<any, { line: number; column: number }> => {
  const allocationLocations = new Map<any, { line: number; column: number }>()
  const addLocation = (path: any) => {
    if (path.node.loc?.start) {
      const { column, line } = path.node.loc.start
      if (!includeGeneratedLocation || includeGeneratedLocation(line, column)) {
        allocationLocations.set(path.node, {
          column,
          line,
        })
      }
    }
  }
  traverse2(ast, {
    ArrayExpression: addLocation,
    CallExpression: (path: any) => {
      addLocation(path)
    },
    NewExpression: addLocation,
    ObjectExpression: addLocation,
    RegExpLiteral: addLocation,
  })
  return allocationLocations
}

export const transformCodeWithAllocationTracking = (code: string, options: TransformOptions = {}): string => {
  if (!code) {
    return ''
  }

  const { filename = '', minify = false, scriptId = filename || 123 } = options

  try {
    const originalAst = parser2.parse(code, {
      plugins: [],
      ranges: false,
      sourceType: 'module',
      tokens: false,
    })

    const allocationLocations = collectAllocationLocations(originalAst, options.includeGeneratedLocation)
    const plugin = createAllocationWrapperPlugin({ allocationLocations, scriptId })
    traverse2(originalAst, plugin)
    allocationLocations.clear()

    const result = generate2(originalAst, {
      comments: true,
      compact: false,
      jsonCompatibleStrings: false,
      minified: minify,
      retainLines: false,
    })

    return result.code
  } catch (error) {
    throw new VError(error, `Error transforming code with allocation tracking:`)
  }
}
