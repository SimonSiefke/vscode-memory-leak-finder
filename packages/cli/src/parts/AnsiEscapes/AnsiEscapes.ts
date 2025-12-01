import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const cursorUp = async (count: number): Promise<string> => {
  return StdoutWorker.invoke('Stdout.getCursorUp', count)
}

export const eraseLine = async (): Promise<string> => {
  return StdoutWorker.invoke('Stdout.getEraseLine')
}

export const cursorLeft = async (): Promise<string> => {
  return StdoutWorker.invoke('Stdout.getCursorLeft')
}

export const eraseScreen = async (): Promise<string> => {
  return StdoutWorker.invoke('Stdout.getEraseScreen')
}

export const eraseDown = async (): Promise<string> => {
  return StdoutWorker.invoke('Stdout.getEraseDown')
}

export const backspace = async (): Promise<string> => {
  return StdoutWorker.invoke('Stdout.getBackspace')
}

export const cursorBackward = async (length: number): Promise<string> => {
  return StdoutWorker.invoke('Stdout.getCursorBackward', length)
}

export const eraseEndLine = async (): Promise<string> => {
  return StdoutWorker.invoke('Stdout.getEraseEndLine')
}

export const clear = async (isWindows: boolean): Promise<string> => {
  return StdoutWorker.invoke('Stdout.getClear', isWindows)
}
