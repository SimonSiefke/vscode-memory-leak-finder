import { traverse2 } from '../BabelHelpers/BabelHelpers.ts'

interface FunctionLocation {
  readonly column: number
  readonly line: number
}

export const getFunctionLocations = (ast: any): Map<any, FunctionLocation> => {
  const functionLocations = new Map<any, FunctionLocation>()

  const collectionVisitor = {
    ArrowFunctionExpression: (path: any) => {
      if (path.node.loc?.start) {
        functionLocations.set(path.node, {
          column: path.node.loc.start.column,
          line: path.node.loc.start.line,
        })
      }
    },
    ClassMethod: (path: any) => {
      if (path.node.loc?.start) {
        functionLocations.set(path.node, {
          column: path.node.loc.start.column,
          line: path.node.loc.start.line,
        })
      }
    },
    FunctionDeclaration: (path: any) => {
      if (path.node.loc?.start) {
        functionLocations.set(path.node, {
          column: path.node.loc.start.column,
          line: path.node.loc.start.line,
        })
      }
    },
    FunctionExpression: (path: any) => {
      if (path.node.loc?.start) {
        functionLocations.set(path.node, {
          column: path.node.loc.start.column,
          line: path.node.loc.start.line,
        })
      }
    },
    ObjectMethod: (path: any) => {
      if (path.node.loc?.start) {
        functionLocations.set(path.node, {
          column: path.node.loc.start.column,
          line: path.node.loc.start.line,
        })
      }
    },
  }

  traverse2(ast, collectionVisitor)
  return functionLocations
}
