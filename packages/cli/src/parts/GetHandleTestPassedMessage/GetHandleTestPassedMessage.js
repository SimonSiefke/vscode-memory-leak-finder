import chalk from 'chalk'
import * as FormatAsSeconds from '../FormatAsSeconds/FormatAsSeconds.js'

const PASS_TEXT = ' PASS '

const PASS = chalk.reset.inverse.bold.green(PASS_TEXT)

const LEAK_TEXT = ' LEAK '

const LEAK = chalk.reset.inverse.blue(LEAK_TEXT)

const formatDuration = (duration) => {
  return `(${FormatAsSeconds.formatAsSeconds(duration)})`
}

export const getHandleTestPassedMessage = (file, relativeDirName, fileName, duration, isLeak) => {
  const messageRelativeDirName = chalk.dim(relativeDirName + '/')
  const messageFileName = chalk.bold(fileName)
  const messageDuration = formatDuration(duration)
  const prefix = isLeak ? LEAK : PASS
  return `${prefix} ${messageRelativeDirName}${messageFileName} ${messageDuration}\n`
}
