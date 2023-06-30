import * as AnsiEscapes from '../AnsiEscapes/AnsiEscapes.js'

const messageCursorUp = AnsiEscapes.cursorUp()
const messageEraseLine = AnsiEscapes.eraseLine

const clearMessage = `${messageCursorUp}${messageEraseLine}`

export const getTestClearMessage = () => {
  return clearMessage
}
