import { VError } from '@lvce-editor/verror'
import type { TransformOptions } from '../Types/Types.ts'
import { generate2, parser2, traverse2 } from '../BabelHelpers/BabelHelpers.ts'
import { createAllocationWrapperPlugin } from '../CreateAllocationWrapperPlugin/CreateAllocationWrapperPlugin.ts'

const collectAllocationLocations = (ast: any): Map<any, { line: number; column: number }> => {
  const allocationLocations = new Map<any, { line: number; column: number }>()
  const addLocation = (path: any) => {
    if (path.node.loc?.start) {
      allocationLocations.set(path.node, {
        column: path.node.loc.start.column,
        line: path.node.loc.start.line,
      })
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

  const { minify = false, scriptId = 123 } = options

  try {
    const originalAst = parser2.parse(code, {
      plugins: [],
      ranges: false,
      sourceType: 'module',
      tokens: false,
    })

    const allocationLocations = collectAllocationLocations(originalAst)
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
