import chalk from 'chalk'
import * as FormatStack from '../FormatStack/FormatStack.ts'
import * as Indent from '../Indent/Indent.ts'
import * as TestPrefix from '../TestPrefix/TestPrefix.ts'

interface TestError {
  type: string
  message: string
  stack: string
  codeFrame: string
}

export const getHandleTestFailedMessage = (
  file: string,
  relativeDirName: string,
  relativeFilePath: string,
  fileName: string,
  error: TestError,
): string => {
  const formattedStack: string = FormatStack.formatStack(error.stack, relativeFilePath)
  const messageRelativeDirName: string = chalk.dim(relativeDirName + '/')
  const messageFileName: string = chalk.bold(fileName)
  return `${TestPrefix.Fail} ${messageRelativeDirName}${messageFileName}

      ${error.type}: ${error.message}

${Indent.indent(error.codeFrame)}

${formattedStack}

`
}
