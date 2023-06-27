import * as IsWindows from '../IsWindows/IsWindows.js'

import ansiEscapes from 'ansi-escapes'

export const cursorUp = ansiEscapes.cursorUp

export const eraseLine = ansiEscapes.eraseLine

export const cursorLeft = ansiEscapes.cursorLeft

export const eraseScreen = ansiEscapes.eraseScreen

export const eraseDown = ansiEscapes.eraseDown

export const backspace = ansiEscapes.cursorBackward() + ansiEscapes.eraseEndLine

export const cursorBackward = ansiEscapes.cursorBackward

export const eraseEndLine = ansiEscapes.eraseEndLine

export const clear = IsWindows.isWindows ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H'
