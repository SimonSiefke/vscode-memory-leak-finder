import chalk from 'chalk'
import * as AnsiEscapes from '../AnsiEscapes/AnsiEscapes.js'
import * as FormatAsSeconds from '../FormatAsSeconds/FormatAsSeconds.js'

const PASS_TEXT = 'PASS'

const PASS = chalk.reset.inverse.bold.green(` ${PASS_TEXT} `)

const formatDuration = (duration) => {
  return `(${FormatAsSeconds.formatAsSeconds(duration)})`
}

export const getHandleTestPassedMessage = (file, relativeDirName, fileName, duration) => {
  const messageCursorUp = AnsiEscapes.cursorUp()
  const messageEraseLine = AnsiEscapes.eraseLine
  const messageRelativeDirName = chalk.dim(relativeDirName + '/')
  const messageFileName = chalk.bold(fileName)
  const messageDuration = formatDuration(duration)
  return `${messageCursorUp}${messageEraseLine}${PASS} ${messageRelativeDirName}${messageFileName} ${messageDuration}\n`
}
