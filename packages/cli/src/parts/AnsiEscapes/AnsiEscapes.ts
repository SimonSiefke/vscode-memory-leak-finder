import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const cursorUp = async (count: number): Promise<string> => {
  return StdoutWorker.invoke('Stdout.cursorUp', count)
}

export const eraseLine = async (): Promise<string> => {
  return StdoutWorker.invoke('Stdout.eraseLine')
}

export const cursorLeft = async (): Promise<string> => {
  return StdoutWorker.invoke('Stdout.cursorLeft')
}

export const eraseScreen = async (): Promise<string> => {
  return StdoutWorker.invoke('Stdout.eraseScreen')
}

export const eraseDown = async (): Promise<string> => {
  return StdoutWorker.invoke('Stdout.eraseDown')
}

export const backspace = async (): Promise<string> => {
  return StdoutWorker.invoke('Stdout.backspace')
}

export const cursorBackward = async (length: number): Promise<string> => {
  return StdoutWorker.invoke('Stdout.cursorBackward', length)
}

export const eraseEndLine = async (): Promise<string> => {
  return StdoutWorker.invoke('Stdout.eraseEndLine')
}

export const clear = async (isWindows: boolean): Promise<string> => {
  return StdoutWorker.invoke('Stdout.getClear', isWindows)
}
