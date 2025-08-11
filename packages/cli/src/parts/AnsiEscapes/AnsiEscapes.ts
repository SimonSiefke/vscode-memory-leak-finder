import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const cursorUp = (count: number) => {
  return StdoutWorker.invoke('Stdout.cursorUp', count)
}

export const eraseLine = () => {
  return StdoutWorker.invoke('Stdout.eraseLine')
}

export const cursorLeft = () => {
  return StdoutWorker.invoke('Stdout.cursorLeft')
}

export const eraseScreen = () => {
  return StdoutWorker.invoke('Stdout.eraseScreen')
}

export const eraseDown = () => {
  return StdoutWorker.invoke('Stdout.eraseDown')
}

export const backspace = () => {
  return StdoutWorker.invoke('Stdout.backspace')
}

export const cursorBackward = () => {
  return StdoutWorker.invoke('Stdout.cursorBackward')
}

export const eraseEndLine = () => {
  return StdoutWorker.invoke('Stdout.eraseEndLine')
}

export const clear = (isWindows: boolean) => {
  return StdoutWorker.invoke('Stdout.clear', isWindows)
}
