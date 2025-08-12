import ansiEscapes from 'ansi-escapes'

export const cursorUp = async (count: number): Promise<string> => {
  return ansiEscapes.cursorUp(count)
}

export const eraseLine = async (): Promise<string> => {
  return ansiEscapes.eraseLine
}

export const cursorLeft = async (): Promise<string> => {
  return ansiEscapes.cursorLeft
}

export const eraseScreen = async (): Promise<string> => {
  return ansiEscapes.eraseScreen
}

export const eraseDown = async (): Promise<string> => {
  return ansiEscapes.eraseDown
}

export const backspace = async (): Promise<string> => {
  return ansiEscapes.cursorBackward() + ansiEscapes.eraseEndLine
}

export const cursorBackward = async (length: number): Promise<string> => {
  return ansiEscapes.cursorBackward(length)
}

export const eraseEndLine = async (): Promise<string> => {
  return ansiEscapes.eraseEndLine
}

export const clear = async (isWindows: boolean): Promise<string> => {
  return isWindows ? '\u001B[2J\u001B[0f' : '\u001B[2J\u001B[3J\u001B[H'
}
