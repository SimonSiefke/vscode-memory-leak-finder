import * as StdoutWorker from '../StdoutWorker/StdoutWorker.js'

export const setRawMode = async (value) => {
  await StdoutWorker.invoke('Stdin.setRawMode', value)
}

export const resume = async () => {
  await StdoutWorker.invoke('Stdin.resume')
}

export const pause = async () => {
  await StdoutWorker.invoke('Stdin.pause')
}

export const setEncoding = async (value) => {
  await StdoutWorker.invoke('Stdin.setEncoding', value)
}

export const on = (event, listener) => {
  // TODO use worker for stdin event handling
  process.stdin.on(event, listener)
}

export const off = (event, listener) => {
  Process.stdin.off(event, listener)
}
