import ansiEscapes from 'ansi-escapes'
import * as IsWindows from '../IsWindows/IsWindows.js'

export const cursorUp = ansiEscapes.cursorUp

export const eraseLine = ansiEscapes.eraseLine

export const cursorLeft = ansiEscapes.cursorLeft

export const eraseScreen = ansiEscapes.eraseScreen

export const eraseDown = ansiEscapes.eraseDown

export const backspace = ansiEscapes.cursorBackward() + ansiEscapes.eraseEndLine

export const cursorBackward = ansiEscapes.cursorBackward

export const eraseEndLine = ansiEscapes.eraseEndLine

export const clear = IsWindows.isWindows ? '\u001B[2J\u001B[0f' : '\u001B[2J\u001B[3J\u001B[H'
