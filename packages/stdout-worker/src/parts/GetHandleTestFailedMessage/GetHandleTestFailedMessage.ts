import chalk from 'chalk'
import * as FormatDuration from '../FormatDuration/FormatDuration.ts'
import * as FormatStack from '../FormatStack/FormatStack.ts'
import * as Indent from '../Indent/Indent.ts'
import * as TestPrefix from '../TestPrefix/TestPrefix.ts'

interface TestError {
  codeFrame: string
  message: string
  stack: string
  type: string
}

export const getHandleTestFailedMessage = (
  file: string,
  relativeDirName: string,
  relativeFilePath: string,
  fileName: string,
  error: TestError,
  wasOriginallySkipped: boolean,
  duration: number,
  showDuration: boolean,
): string => {
  const formattedStack: string = FormatStack.formatStack(error.stack, relativeFilePath)
  const messageRelativeDirName: string = chalk.dim(relativeDirName + '/')
  const messageFileName: string = chalk.bold(fileName)
  const prefix = wasOriginallySkipped ? TestPrefix.SkipFail : TestPrefix.Fail
  const messageDuration = wasOriginallySkipped && showDuration ? ` ${FormatDuration.formatDuration(duration)}` : ''
  return `${prefix} ${messageRelativeDirName}${messageFileName}${messageDuration}

      ${error.type}: ${error.message}

${Indent.indent(error.codeFrame)}

${formattedStack}

`
}
