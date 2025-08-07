import chalk from 'chalk'
import * as FormatAsSeconds from '../FormatAsSeconds/FormatAsSeconds.js'
import * as TestPrefix from '../TestPrefix/TestPrefix.js'

const formatDuration = (duration) => {
  return `(${FormatAsSeconds.formatAsSeconds(duration)})`
}

export const getHandleTestPassedMessage = (file, relativeDirName, fileName, duration, isLeak) => {
  const messageRelativeDirName = chalk.dim(relativeDirName + '/')
  const messageFileName = chalk.bold(fileName)
  const messageDuration = formatDuration(duration)
  const prefix = isLeak ? TestPrefix.Leak : TestPrefix.Pass
  return `${prefix} ${messageRelativeDirName}${messageFileName} ${messageDuration}\n`
}
