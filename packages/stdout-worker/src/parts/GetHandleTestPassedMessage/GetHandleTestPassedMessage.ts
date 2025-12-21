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
  wasOriginallySkipped: boolean,
): string => {
  const messageRelativeDirName: string = chalk.dim(relativeDirName + '/')
  const messageFileName: string = chalk.bold(fileName)
  const messageDuration: string = formatDuration(duration)
  let prefix: string
  if (isLeak && wasOriginallySkipped) {
    prefix = TestPrefix.SkipLeak
  } else if (isLeak) {
    prefix = TestPrefix.Leak
  } else if (wasOriginallySkipped) {
    prefix = TestPrefix.SkipPass
  } else {
    prefix = TestPrefix.Pass
  }
  return `${prefix} ${messageRelativeDirName}${messageFileName} ${messageDuration}\n`
}
