import stripAnsi from 'strip-ansi'
import { LaunchError } from '../LaunchError/LaunchError.ts'
import * as MergeStacks from '../MergeStacks/MergeStacks.ts'

const RE_ES_MODULES_NOT_SUPPORTED = /require\(\) of ES Module .* not supported/
const RE_PATH = /^(\/.*\.js:\d+)$/
const APP_LOAD_ERROR_MESSAGE = 'App threw an error during load'
const APP_LOAD_ERROR_TIMEOUT = 1000

const normalizeLine = (line: string): string => {
  const trimmedLine = line.trim()
  if (trimmedLine === '-') {
    return ''
  }
  return trimmedLine
}

const maybeAddColon = (line: string, index: number, array: string[]): string => {
  if (line.endsWith(':')) {
    return line
  }
  if (index === array.length - 1) {
    return line
  }
  return `${line}:`
}

const isStackLine = (line: string): boolean => {
  return line.startsWith('    at ')
}

interface ReadableStreamLike {
  on(event: 'data', listener: (data: string | Buffer) => void): unknown
  on(event: 'end' | 'close', listener: () => void): unknown
  on(event: 'error', listener: (error: unknown) => void): unknown
  off?(event: 'data', listener: (data: string | Buffer) => void): unknown
  off?(event: 'end' | 'close', listener: () => void): unknown
  off?(event: 'error', listener: (error: unknown) => void): unknown
  removeListener?(event: 'data', listener: (data: string | Buffer) => void): unknown
  removeListener?(event: 'end' | 'close', listener: () => void): unknown
  removeListener?(event: 'error', listener: (error: unknown) => void): unknown
}

const removeListener = <T extends 'data' | 'end' | 'close' | 'error'>(
  stream: ReadableStreamLike,
  event: T,
  listener: (...args: any[]) => void,
): void => {
  if (stream.off) {
    stream.off(event as any, listener as any)
    return
  }
  if (stream.removeListener) {
    stream.removeListener(event as any, listener as any)
  }
}

const waitForNextData = (stream: ReadableStreamLike): Promise<string> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup()
      resolve('')
    }, APP_LOAD_ERROR_TIMEOUT)
    timeout.unref?.()

    const cleanup = (): void => {
      clearTimeout(timeout)
      removeListener(stream, 'data', handleData)
      removeListener(stream, 'end', handleEnd)
      removeListener(stream, 'close', handleEnd)
      removeListener(stream, 'error', handleError)
    }

    const handleData = (data: string | Buffer): void => {
      cleanup()
      resolve(String(data))
    }
    const handleEnd = (): void => {
      cleanup()
      resolve('')
    }
    const handleError = (error: unknown): void => {
      cleanup()
      reject(error instanceof Error ? error : new Error(String(error)))
    }

    stream.on('data', handleData)
    stream.on('end', handleEnd)
    stream.on('close', handleEnd)
    stream.on('error', handleError)
  })
}

const getInlineAppLoadErrorData = (firstData: string): string => {
  const normalData = stripAnsi(firstData)
  const headerIndex = normalData.indexOf(APP_LOAD_ERROR_MESSAGE)
  const errorData = normalData.slice(headerIndex + APP_LOAD_ERROR_MESSAGE.length)
  return errorData.trimStart()
}

const parseAppLoadError = (firstData: string, errorData: string): Error => {
  const normalErrorData = stripAnsi(errorData)
  const lines = normalErrorData.trim().split('\n')
  if (!normalErrorData.trim()) {
    return new Error(APP_LOAD_ERROR_MESSAGE)
  }
  if (RE_ES_MODULES_NOT_SUPPORTED.test(normalErrorData)) {
    return new Error(`${APP_LOAD_ERROR_MESSAGE}: ${lines[0]}`)
  }
  const stackLineIndex = lines.findIndex(isStackLine)
  if (stackLineIndex === 1) {
    const error = new Error()
    const messageLine = lines[0]
    error.message = `${APP_LOAD_ERROR_MESSAGE}: ${messageLine}`
    const mergedStack = MergeStacks.mergeStacks(error.stack, lines.slice(stackLineIndex).join('\n'))
    if (mergedStack !== undefined) {
      error.stack = mergedStack
    }
    return error
  }
  if (RE_PATH.test(lines[0]) && stackLineIndex !== -1) {
    const error = new Error()
    const messageLine = lines[stackLineIndex - 1]
    const codeFrameLines = lines.slice(1, stackLineIndex - 1)
    error.message = `${APP_LOAD_ERROR_MESSAGE}: ${messageLine}`
    ;(error as Error & { codeFrame?: string | undefined }).codeFrame = `${codeFrameLines.join('\n')}`.trim()
    const mergedStack = MergeStacks.mergeStacks(error.stack, `    at ${lines[0]}\n${lines.slice(stackLineIndex).join('\n')}`)
    if (mergedStack !== undefined) {
      error.stack = mergedStack
    }
    return error
  }
  return new Error(`${firstData}${normalErrorData}`)
}

export const getElectronErrorMessage = async (firstData: string, stream?: ReadableStreamLike): Promise<Error> => {
  if (firstData.includes('Error launching app')) {
    const normalData = stripAnsi(firstData)
    const lines = normalData.split('\n')
    const message = lines.map(normalizeLine).filter(Boolean).map(maybeAddColon).join(' ')
    return new LaunchError(message)
  }
  if (firstData.includes(APP_LOAD_ERROR_MESSAGE)) {
    const inlineErrorData = getInlineAppLoadErrorData(firstData)
    if (inlineErrorData) {
      return parseAppLoadError(firstData, inlineErrorData)
    }
    if (!stream) {
      throw new Error('Stream is required when App threw an error during load')
    }
    const secondData = await waitForNextData(stream)
    return parseAppLoadError(firstData, secondData)
  }
  return new Error(`Failed to connect to devtools: Unexpected first message: ${firstData}`)
}
