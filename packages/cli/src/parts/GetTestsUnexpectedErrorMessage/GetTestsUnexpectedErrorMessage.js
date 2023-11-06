import * as Character from '../Character/Character.js'
import * as FormatStack from '../FormatStack/FormatStack.js'
import * as TestPrefix from '../TestPrefix/TestPrefix.js'

const indentLine = (line) => {
  return '    ' + line
}

const indent = (string) => {
  if (!string) {
    return Character.EmptyString
  }
  return string.split('\n').map(indentLine).join('\n')
}

export const getTestsUnexpectedErrorMessage = (error) => {
  const formattedStack = FormatStack.formatStack(error.stack, '')
  return `${TestPrefix.UnexpectedError}

      ${error.message}

${indent(error.codeFrame)}

${formattedStack}

`
}
