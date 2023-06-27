import * as Process from '../Process/Process.js'

export const setRawMode = (value) => {
  Process.stdin.setRawMode(value)
}

export const resume = () => {
  Process.stdin.resume()
}

export const pause = () => {
  Process.stdin.pause()
}

export const setEncoding = (value) => {
  Process.stdin.setEncoding(value)
}

export const on = (event, listener) => {
  Process.stdin.on(event, listener)
}

export const off = (event, listener) => {
  Process.stdin.off(event, listener)
}
