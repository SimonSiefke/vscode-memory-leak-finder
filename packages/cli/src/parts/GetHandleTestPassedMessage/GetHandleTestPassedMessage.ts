import chalk from 'chalk'
import * as FormatDuration from '../FormatDuration/FormatDuration.ts'
import * as TestPrefix from '../TestPrefix/TestPrefix.ts'

export const getHandleTestPassedMessage = async (
  file: string,
  relativeDirName: string,
  fileName: string,
  duration: number,
  isLeak: boolean,
): Promise<string> => {
  const messageRelativeDirName = chalk.dim(relativeDirName + '/')
  const messageFileName = chalk.bold(fileName)
  const messageDuration = FormatDuration.formatDuration(duration)
  const prefix = isLeak ? TestPrefix.Leak : TestPrefix.Pass
  return `${prefix} ${messageRelativeDirName}${messageFileName} ${messageDuration}\n`
}
