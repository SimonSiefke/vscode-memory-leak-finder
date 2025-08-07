import chalk from 'chalk'
import * as FormatStack from '../FormatStack/FormatStack.ts'
import * as Indent from '../Indent/Indent.ts'
import * as TestPrefix from '../TestPrefix/TestPrefix.ts'

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
