import { once } from 'node:events'
import stripAnsi from 'strip-ansi'
import { LaunchError } from '../LaunchError/LaunchError.ts'
import * as MergeStacks from '../MergeStacks/MergeStacks.ts'

const RE_ES_MODULES_NOT_SUPPORTED = /require\(\) of ES Module .* not supported/
const RE_PATH = /^(\/.*\.js:\d+)$/

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
  on(event: 'data', listener: (data: string) => void): unknown
}

export const getElectronErrorMessage = async (firstData: string, stream?: ReadableStreamLike): Promise<Error> => {
  if (firstData.includes('Error launching app')) {
    const normalData = stripAnsi(firstData)
    const lines = normalData.split('\n')
    const message = lines.map(normalizeLine).filter(Boolean).map(maybeAddColon).join(' ')
    return new LaunchError(message)
  }
  if (firstData.includes('App threw an error during load')) {
    if (!stream) {
      throw new Error('Stream is required when App threw an error during load')
    }
    const [secondData] = await once(stream, 'data') as [string]
    const lines = secondData.trim().split('\n')
    if (RE_ES_MODULES_NOT_SUPPORTED.test(secondData)) {
      return new Error(`App threw an error during load: ${lines[0]}`)
    }
    const stackLineIndex = lines.findIndex(isStackLine)
    if (stackLineIndex === 1) {
      const error = new Error()
      const messageLine = lines[0]
      error.message = `App threw an error during load: ${messageLine}`
      const mergedStack = MergeStacks.mergeStacks(error.stack, lines.slice(stackLineIndex).join('\n'))
      error.stack = mergedStack ?? undefined ?? undefined
      return error
    }
    if (RE_PATH.test(lines[0])) {
      const error = new Error()
      const messageLine = lines[stackLineIndex - 1]
      const codeFrameLines = lines.slice(1, stackLineIndex - 1)
      error.message = `App threw an error during load: ${messageLine}`
      ;(error as Error & { codeFrame?: string | undefined }).codeFrame = `${codeFrameLines.join('\n')}`.trim()
      const mergedStack = MergeStacks.mergeStacks(error.stack, `    at ${lines[0]}\n${lines.slice(stackLineIndex).join('\n')}`)
      error.stack = mergedStack ?? undefined
      return error
    }
    return new Error(`${firstData}${secondData}`)
  }
  return new Error(`Failed to connect to devtools: Unexpected first message: ${firstData}`)
}
