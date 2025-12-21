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
  wasOriginallySkipped: boolean,
): string => {
  const formattedStack: string = FormatStack.formatStack(error.stack, relativeFilePath)
  const messageRelativeDirName: string = chalk.dim(relativeDirName + '/')
  const messageFileName: string = chalk.bold(fileName)
  const prefix = wasOriginallySkipped ? TestPrefix.SkipFail : TestPrefix.Fail
  return `${prefix} ${messageRelativeDirName}${messageFileName}

      ${error.type}: ${error.message}

${Indent.indent(error.codeFrame)}

${formattedStack}

`
}
