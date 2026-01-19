import { traverse2 } from '../BabelHelpers/BabelHelpers.ts'

export const getFunctionLocations = (ast: any): Map<any, { line: number; column: number }> => {
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
