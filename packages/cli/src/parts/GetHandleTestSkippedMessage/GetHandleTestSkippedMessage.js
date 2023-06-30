import chalk from 'chalk'
import * as AnsiEscapes from '../AnsiEscapes/AnsiEscapes.js'
import * as FormatAsSeconds from '../FormatAsSeconds/FormatAsSeconds.js'

const SKIP_TEXT = 'SKIP'

const SKIP = chalk.reset.inverse.bold.yellow(` ${SKIP_TEXT} `)

const messageCursorUp = AnsiEscapes.cursorUp()
const messageEraseLine = AnsiEscapes.eraseLine
const PREFIX = `${messageCursorUp}${messageEraseLine}${SKIP}`

const formatDuration = (duration) => {
  return `(${FormatAsSeconds.formatAsSeconds(duration)})`
}

export const getHandleTestSkippedMessage = (file, relativeDirName, fileName, duration) => {
  const messageRelativeDirName = chalk.dim(relativeDirName + '/')
  const messageFileName = chalk.bold(fileName)
  const messageDuration = formatDuration(duration)
  return `${PREFIX} ${messageRelativeDirName}${messageFileName} ${messageDuration}\n`
}
