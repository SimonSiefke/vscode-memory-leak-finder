import chalk from 'chalk'
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

export const getHandleTestFailedMessage = (file, relativeDirName, relativeFilePath, fileName, error) => {
  const formattedStack = FormatStack.formatStack(error.stack, relativeFilePath)
  const messageRelativeDirName = chalk.dim(relativeDirName + '/')
  const messageFileName = chalk.bold(fileName)
  return `${TestPrefix.Fail} ${messageRelativeDirName}${messageFileName}

      ${error.message}

${indent(error.codeFrame)}

${formattedStack}

`
}
