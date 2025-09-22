import { parse } from '@babel/parser'
import type * as t from '@babel/types'

export const parseAst = (sourceContent: string): t.File => {
  if (!sourceContent) {
    throw new Error('No source content provided')
  }

  try {
    const ast = parse(sourceContent, {
      sourceType: 'module',
      plugins: ['typescript', 'classProperties', 'decorators-legacy'],
      ranges: false,
      errorRecovery: true,
      tokens: false,
    })

    return ast
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`AST parsing failed: ${errorMessage}`)
  }
}
