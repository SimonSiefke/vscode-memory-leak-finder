import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const cursorUp = async (count: number) => {
  return StdoutWorker.invoke('Stdout.cursorUp', count)
}

export const eraseLine = async () => {
  return StdoutWorker.invoke('Stdout.eraseLine')
}

export const cursorLeft = async () => {
  return StdoutWorker.invoke('Stdout.cursorLeft')
}

export const eraseScreen = async () => {
  return StdoutWorker.invoke('Stdout.eraseScreen')
}

export const eraseDown = async () => {
  return StdoutWorker.invoke('Stdout.eraseDown')
}

export const backspace = async () => {
  return StdoutWorker.invoke('Stdout.backspace')
}

export const cursorBackward = async () => {
  return StdoutWorker.invoke('Stdout.cursorBackward')
}

export const eraseEndLine = async () => {
  return StdoutWorker.invoke('Stdout.eraseEndLine')
}

export const clear = async (isWindows: boolean) => {
  return StdoutWorker.invoke('Stdout.clear', isWindows)
}
