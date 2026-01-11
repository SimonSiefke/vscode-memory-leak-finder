import * as Process from '../Process/Process.ts'

export const setRawMode = async (value: boolean): Promise<void> => {
  Process.stdin.setRawMode(value)
}

export const resume = async (): Promise<void> => {
  Process.stdin.resume()
}

export const pause = async (): Promise<void> => {
  Process.stdin.pause()
}

export const setEncoding = async (value: BufferEncoding): Promise<void> => {
  Process.stdin.setEncoding(value)
}

export const on = (event: string, listener: (...args: any[]) => void): void => {
  Process.stdin.on(event, listener)
}

export const off = (event: string, listener: (...args: any[]) => void): void => {
  Process.stdin.off(event, listener)
}
