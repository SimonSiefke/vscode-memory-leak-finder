import chalk from 'chalk'
import * as FormatStack from '../FormatStack/FormatStack.js'
import * as Indent from '../Indent/Indent.js'
import * as TestPrefix from '../TestPrefix/TestPrefix.js'

export const getHandleTestFailedMessage = (file, relativeDirName, relativeFilePath, fileName, error) => {
  const formattedStack = FormatStack.formatStack(error.stack, relativeFilePath)
  const messageRelativeDirName = chalk.dim(relativeDirName + '/')
  const messageFileName = chalk.bold(fileName)
  return `${TestPrefix.Fail} ${messageRelativeDirName}${messageFileName}

      ${error.type}: ${error.message}

${Indent.indent(error.codeFrame)}

${formattedStack}

`
}
