import chalk from 'chalk'
import * as Character from '../Character/Character.js'
import * as FormatStack from '../FormatStack/FormatStack.js'

const indentLine = (line) => {
  return '    ' + line
}

const indent = (string) => {
  if (!string) {
    return Character.EmptyString
  }
  return string.split('\n').map(indentLine).join('\n')
}

const UNEXPECTED_ERROR_TEXT = ' Unexpected Error '
const UNEXPECTED_ERROR = chalk.reset.inverse.bold.red(UNEXPECTED_ERROR_TEXT)

export const getTestsUnexpectedErrorMessage = (error) => {
  const formattedStack = FormatStack.formatStack(error.stack, '')
  return `${UNEXPECTED_ERROR}

      ${error.message}

${indent(error.codeFrame)}

${formattedStack}

`
}
