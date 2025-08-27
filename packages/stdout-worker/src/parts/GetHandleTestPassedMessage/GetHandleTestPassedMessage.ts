import chalk from 'chalk'
import { formatDuration } from '../FormatDuration/FormatDuration.ts'
import * as TestPrefix from '../TestPrefix/TestPrefix.ts'

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
  const core: string = `${prefix} ${messageRelativeDirName}${messageFileName} ${messageDuration}\n`
  return core
}
