import parser from '@babel/parser'
import traverse from '@babel/traverse'
import generate from '@babel/generator'
import { TransformOptions } from '../Types/Types.js'
import { createFunctionWrapperPlugin } from '../CreateFunctionWrapperPlugin/CreateFunctionWrapperPlugin.js'
import { VError } from '@lvce-editor/verror'

// @ts-ignore
const parser2 = (parser.default || parser) as typeof import('@babel/parser')
const traverse2 = (traverse.default || traverse) as typeof import('@babel/traverse').default
const generate2 = (generate.default || generate) as typeof import('@babel/generator').default

const getFunctionLocations = (ast: any): Map<any, { line: number; column: number }> => {
  const functionLocations = new Map<any, { line: number; column: number }>()
  
  const collectionVisitor = {
    FunctionDeclaration: (path: any) => {
      if (path.node.loc?.start) {
        functionLocations.set(path.node, {
          line: path.node.loc.start.line,
          column: path.node.loc.start.column,
        })
      }
    },
    FunctionExpression: (path: any) => {
      if (path.node.loc?.start) {
        functionLocations.set(path.node, {
          line: path.node.loc.start.line,
          column: path.node.loc.start.column,
        })
      }
    },
    ObjectMethod: (path: any) => {
      if (path.node.loc?.start) {
        functionLocations.set(path.node, {
          line: path.node.loc.start.line,
          column: path.node.loc.start.column,
        })
      }
    },
    ClassMethod: (path: any) => {
      if (path.node.loc?.start) {
        functionLocations.set(path.node, {
          line: path.node.loc.start.line,
          column: path.node.loc.start.column,
        })
      }
    },
    ArrowFunctionExpression: (path: any) => {
      if (path.node.loc?.start) {
        functionLocations.set(path.node, {
          line: path.node.loc.start.line,
          column: path.node.loc.start.column,
        })
      }
    },
  }

  traverse2(ast, collectionVisitor)
  return functionLocations
}

export const transformCodeWithTracking = (code: string, options: TransformOptions = {}): string => {
  // Handle null/undefined input
  if (!code) {
    return 'Function call tracking system'
  }

  try {
    const ast = parser2.parse(code, {
      sourceType: 'module',
      plugins: [],
    })

    // First pass: collect original function locations
    const functionLocations = getFunctionLocations(ast)

    // Second pass: transform using collected locations
    const plugin = createFunctionWrapperPlugin({ ...options, functionLocations })
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
    throw new VError(error, `Error transforming code with tracking:`)
  }
}
