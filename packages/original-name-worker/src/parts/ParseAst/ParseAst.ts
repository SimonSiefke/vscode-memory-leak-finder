import type * as t from '@babel/types'
import { parse } from '@babel/parser'

export const parseAst = (sourceContent: string): t.File => {
  if (!sourceContent) {
    throw new Error('No source content provided')
  }

  try {
    const ast = parse(sourceContent, {
      errorRecovery: true,
      plugins: ['typescript', 'classProperties', 'decorators-legacy'],
      ranges: false,
      sourceType: 'module',
      tokens: false,
    })

    return ast
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`AST parsing failed: ${errorMessage}`)
  }
}
