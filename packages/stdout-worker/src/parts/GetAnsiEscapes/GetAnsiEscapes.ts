import ansiEscapes from 'ansi-escapes'

const isWindows: boolean = process.platform === 'win32'

export const getCursorUp = (): string => ansiEscapes.cursorUp()

export const getEraseLine = (): string => ansiEscapes.eraseLine

export const getCursorLeft = (): string => ansiEscapes.cursorLeft

export const getEraseScreen = (): string => ansiEscapes.eraseScreen

export const getEraseDown = (): string => ansiEscapes.eraseDown

export const getBackspace = (): string => ansiEscapes.cursorBackward() + ansiEscapes.eraseEndLine

export const getCursorBackward = (): string => ansiEscapes.cursorBackward()

export const getEraseEndLine = (): string => ansiEscapes.eraseEndLine

export const getClear = (): string => {
  return isWindows ? '\u001B[2J\u001B[0f' : '\u001B[2J\u001B[3J\u001B[H'
}
