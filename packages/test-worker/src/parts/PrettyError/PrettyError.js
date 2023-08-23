import { codeFrameColumns } from '@babel/code-frame'
import { readFileSync } from 'node:fs'
import * as CleanStack from '../CleanStack/CleanStack.js'
import * as EncodingType from '../EncodingType/EncodingType.js'
import * as ErrorCodes from '../ErrorCodes/ErrorCodes.js'
import * as GetActualPath from '../GetActualPath/GetActualPath.js'
import * as JoinLines from '../JoinLines/JoinLines.js'
import * as Logger from '../Logger/Logger.js'
import * as SplitLines from '../SplitLines/SplitLines.js'

const RE_MODULE_NOT_FOUND_STACK = /Cannot find package '([^']+)' imported from (.+)$/

const prepareModuleNotFoundError = (error) => {
  const { message } = error
  const match = message.match(RE_MODULE_NOT_FOUND_STACK)
  if (!match) {
    return {
      message,
      stack: error.stack,
      codeFrame: '',
    }
  }
  const notFoundModule = match[1]
  const importedFrom = match[2]
  const rawLines = readFileSync(importedFrom, EncodingType.Utf8)
  let line = 0
  let column = 0
  const splittedLines = SplitLines.splitLines(rawLines)
  for (let i = 0; i < splittedLines.length; i++) {
    const splittedLine = splittedLines[i]
    const index = splittedLine.indexOf(notFoundModule)
    if (index !== -1) {
      line = i + 1
      column = index
      break
    }
  }
  const location = {
    start: {
      line,
      column,
    },
  }
  const codeFrame = codeFrameColumns(rawLines, location)
  const stackLines = SplitLines.splitLines(error.stack)
  const newStackLines = [stackLines[0], `    at ${importedFrom}:${line}:${column}`, ...stackLines.slice(1)]
  const newStack = JoinLines.joinLines(newStackLines)
  return {
    message,
    stack: newStack,
    codeFrame,
  }
}

export const prepare = (error) => {
  try {
    if (error && error.code === ErrorCodes.ERR_MODULE_NOT_FOUND) {
      return prepareModuleNotFoundError(error)
    }
    const { message } = error
    if (error && error.cause) {
      const cause = error.cause()
      if (cause) {
        error = cause
      }
    }
    const lines = CleanStack.cleanStack(error.stack)
    const file = lines[0]
    let codeFrame = ''
    if (error.codeFrame) {
      codeFrame = error.codeFrame
    } else if (file) {
      let match = file.match(/\((.*):(\d+):(\d+)\)$/)
      if (!match) {
        match = file.match(/at (.*):(\d+):(\d+)$/)
      }
      if (match) {
        const [_, path, line, column] = match
        const actualPath = GetActualPath.getActualPath(path)
        const rawLines = readFileSync(actualPath, EncodingType.Utf8)
        const location = {
          start: {
            line: Number.parseInt(line),
            column: Number.parseInt(column),
          },
        }
        codeFrame = codeFrameColumns(rawLines, location)
      }
    }
    const relevantStack = JoinLines.joinLines(lines)
    return {
      message,
      stack: relevantStack,
      codeFrame,
      type: error.constructor.name,
      code: error.code,
    }
  } catch (otherError) {
    Logger.warn(`ErrorHandling Error: ${otherError}`)
    return error
  }
}
