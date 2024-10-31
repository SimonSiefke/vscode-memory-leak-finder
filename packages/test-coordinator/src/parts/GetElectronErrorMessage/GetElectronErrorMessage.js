import { once } from 'node:events'
import stripAnsi from 'strip-ansi'
import * as MergeStacks from '../MergeStacks/MergeStacks.js'
import { LaunchError } from '../LaunchError/LaunchError.js'

const RE_ES_MODULES_NOT_SUPPORTED = /require\(\) of ES Module .* not supported/
const RE_PATH = /^(\/.*\.js:\d+)$/

const normalizeLine = (line) => {
  const trimmedLine = line.trim()
  if (trimmedLine === '-') {
    return ''
  }
  return trimmedLine
}

const maybeAddColon = (line, index, array) => {
  if (line.endsWith(':')) {
    return line
  }
  if (index === array.length - 1) {
    return line
  }
  return `${line}:`
}

const isStackLine = (line) => {
  return line.startsWith('    at ')
}

export const getElectronErrorMessage = async (firstData, stream) => {
  if (firstData.includes('Error launching app')) {
    const normalData = stripAnsi(firstData)
    const lines = normalData.split('\n')
    const message = lines.map(normalizeLine).filter(Boolean).map(maybeAddColon).join(' ')
    return new LaunchError(message)
  }
  if (firstData.includes('App threw an error during load')) {
    const [secondData] = await once(stream, 'data')
    // @ts-ignore
    const lines = secondData.trim().split('\n')
    // @ts-ignore
    if (RE_ES_MODULES_NOT_SUPPORTED.test(secondData)) {
      return new Error(`App threw an error during load: ${lines[0]}`)
    }
    const stackLineIndex = lines.findIndex(isStackLine)
    if (stackLineIndex === 1) {
      const error = new Error()
      const messageLine = lines[0]
      error.message = `App threw an error during load: ${messageLine}`
      const mergedStack = MergeStacks.mergeStacks(error.stack, lines.slice(stackLineIndex).join('\n'))
      error.stack = mergedStack
      return error
    }
    if (RE_PATH.test(lines[0])) {
      const error = new Error()
      const messageLine = lines[stackLineIndex - 1]
      const codeFrameLines = lines.slice(1, stackLineIndex - 1)
      error.message = `App threw an error during load: ${messageLine}`
      // @ts-ignore
      error.codeFrame = `${codeFrameLines.join('\n')}`.trim()
      const mergedStack = MergeStacks.mergeStacks(error.stack, `    at ${lines[0]}\n${lines.slice(stackLineIndex).join('\n')}`)
      error.stack = mergedStack
      return error
    }
    return new Error(`${firstData}${secondData}`)
  }
  return new Error(`Failed to connect to devtools: Unexpected first message: ${firstData}`)
}
