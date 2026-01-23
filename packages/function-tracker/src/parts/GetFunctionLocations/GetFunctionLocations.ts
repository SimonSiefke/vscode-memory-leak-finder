import { traverse2 } from '../BabelHelpers/BabelHelpers.ts'

interface FunctionLocation {
  readonly line: number
  readonly column: number
}

export const getFunctionLocations = (ast: any): Map<any, FunctionLocation> => {
  const functionLocations = new Map<any, FunctionLocation>()

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
