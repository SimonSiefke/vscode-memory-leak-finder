import chalk from 'chalk'
import * as FormatAsSeconds from '../FormatAsSeconds/FormatAsSeconds.ts'
import * as TestPrefix from '../TestPrefix/TestPrefix.ts'

const formatDuration = (duration: number): string => {
  return `(${FormatAsSeconds.formatAsSeconds(duration)})`
}

export const getHandleTestPassedMessage = (
  file: string,
  relativeDirName: string,
  fileName: string,
  duration: number,
  isLeak: boolean,
): string => {
  const messageRelativeDirName: string = chalk.dim(relativeDirName + '/')
  const messageFileName: string = chalk.bold(fileName)
  const messageDuration: string = formatDuration(duration)
  const prefix: string = isLeak ? TestPrefix.Leak : TestPrefix.Pass
  return `${prefix} ${messageRelativeDirName}${messageFileName} ${messageDuration}\n`
}
