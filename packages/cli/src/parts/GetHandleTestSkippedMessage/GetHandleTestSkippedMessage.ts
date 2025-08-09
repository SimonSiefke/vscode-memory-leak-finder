import chalk from 'chalk'
import * as FormatDuration from '../FormatDuration/FormatDuration.ts'

const SKIP_TEXT = ' SKIP '

const SKIP = chalk.reset.inverse.bold.yellow(SKIP_TEXT)

export const getHandleTestSkippedMessage = (file: string, relativeDirName: string, fileName: string, duration: number): string => {
  const messageRelativeDirName = chalk.dim(relativeDirName + '/')
  const messageFileName = chalk.bold(fileName)
  const messageDuration = FormatDuration.formatDuration(duration)
  return `${SKIP} ${messageRelativeDirName}${messageFileName} ${messageDuration}\n`
}
