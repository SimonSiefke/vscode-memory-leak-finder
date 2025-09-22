import { parse } from '@babel/parser'
import type * as t from '@babel/types'

export const parseAst = (sourceContent: string): t.File => {
  if (!sourceContent) {
    throw new Error('No source content provided')
  }

  // Preprocess source to handle anonymous classes
  let processedSource = sourceContent
  // Match "class extends" pattern and add a name
  processedSource = processedSource.replace(/^(\s*)class\s+extends\s+/gm, '$1class AnonymousClass extends ')

  try {
    const ast = parse(processedSource, {
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
