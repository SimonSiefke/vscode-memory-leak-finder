import chalk from 'chalk'
import * as AnsiEscapes from '../AnsiEscapes/AnsiEscapes.js'
import * as FormatStack from '../FormatStack/FormatStack.js'

const indentLine = (line) => {
  return '    ' + line
}

const indent = (string) => {
  if (!string) {
    return ''
  }
  return string.split('\n').map(indentLine).join('\n')
}

const FAIL_TEXT = 'FAIL'
const FAIL = chalk.reset.inverse.bold.red(` ${FAIL_TEXT} `)

export const getHandleTestFailedMessage = (file, relativeDirName, relativeFilePath, fileName, error) => {
  const formattedStack = FormatStack.formatStack(error.stack, relativeFilePath)
  const messageCursorUp = AnsiEscapes.cursorUp()
  const messageEraseLine = AnsiEscapes.eraseLine
  const messageRelativeDirName = chalk.dim(relativeDirName + '/')
  const messageFileName = chalk.bold(fileName)
  return `${messageCursorUp}${messageEraseLine}${FAIL} ${messageRelativeDirName}${messageFileName}

      ${error.message}

${indent(error.codeFrame)}

${formattedStack}

`
}
