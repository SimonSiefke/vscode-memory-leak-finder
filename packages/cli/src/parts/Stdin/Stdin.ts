import * as Process from '../Process/Process.ts'

export const setRawMode = async (value) => {
  Process.stdin.setRawMode(value)
}

export const resume = async () => {
  Process.stdin.resume()
}

export const pause = async () => {
  Process.stdin.pause()
}

export const setEncoding = async (value) => {
  Process.stdin.setEncoding(value)
}

export const on = (event, listener) => {
  Process.stdin.on(event, listener)
}

export const off = (event, listener) => {
  Process.stdin.off(event, listener)
}
