import { parse } from '@babel/parser'
import * as t from '@babel/types'

export const parseAst = (sourceContent: string): t.File => {
  if (!sourceContent) {
    throw new Error('No source content provided')
  }

  // Handle "class extends" case by temporarily adding a class name
  let processedSource = sourceContent
  if (sourceContent.includes('class extends ') && !sourceContent.match(/class\s+\w+\s+extends/)) {
    processedSource = sourceContent.replace(/class\s+extends/g, 'class AnonymousClass extends')
  }

  try {
    const ast = parse(processedSource, {
      sourceType: 'module',
      plugins: ['typescript', 'classProperties', 'decorators-legacy'],
      ranges: false,
      errorRecovery: true,
      tokens: false,
    }) as unknown as t.File
    
    return ast
  } catch (error) {
    throw new Error(`AST parsing failed: ${error.message}`)
  }
}
