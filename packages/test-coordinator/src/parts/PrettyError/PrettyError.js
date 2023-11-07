import { codeFrameColumns } from '@babel/code-frame'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import * as CleanStack from '../CleanStack/CleanStack.js'
import * as ErrorCodes from '../ErrorCodes/ErrorCodes.js'
import * as FileSystem from '../FileSystem/FileSystem.js'
import * as SplitLines from '../SplitLines/SplitLines.js'

const getActualPath = (fileUri) => {
  if (fileUri.startsWith('file://')) {
    return fileURLToPath(fileUri)
  }
  return fileUri
}

const RE_MODULE_NOT_FOUND_STACK = /Cannot find package '([^']+)' imported from (.+)$/

const prepareModuleNotFoundError = (error) => {
  const message = error.message
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
  const rawLines = readFileSync(importedFrom, 'utf-8')
  let line = 0
  let column = 0
  const splittedLines = rawLines.split('\n')
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
  const codeFrame = codeFrameColumns(rawLines, location, { highlightCode: false })
  const stackLines = SplitLines.splitLines(error.stack)
  const newStackLines = [stackLines[0], `    at ${importedFrom}:${line}:${column}`, ...stackLines.slice(1)]
  const newStack = newStackLines.join('\n')
  return {
    message,
    stack: newStack,
    codeFrame,
  }
}

const getPathDetails = (lines) => {
  for (let i = 0; i < lines.length; i++) {
    let file = lines[i]
    if (file) {
      let match = file.match(/\((.*):(\d+):(\d+)\)$/)
      if (!match) {
        match = file.match(/at (.*):(\d+):(\d+)$/)
      }
      if (match) {
        const [_, path, line, column] = match
        if (path === '<anonymous>' || path === 'debugger eval code') {
          continue
        }
        const actualPath = getActualPath(path)
        return {
          line: Number.parseInt(line),
          column: Number.parseInt(column),
          path: actualPath,
        }
      }
    }
  }
  return undefined
}

const getCodeFrame = (cleanedStack, { color }) => {
  try {
    const lines = SplitLines.splitLines(cleanedStack)
    const pathDetails = getPathDetails(lines)
    if (!pathDetails) {
      return ''
    }
    const { path, line, column } = pathDetails
    const actualPath = getActualPath(path)
    const rawLines = FileSystem.readFileSync(actualPath, 'utf-8')
    const location = {
      start: {
        line: line,
        column: column,
      },
    }
    const codeFrame = codeFrameColumns(rawLines, location, { highlightCode: color, forceColor: color })
    return codeFrame
  } catch (error) {
    console.warn(`failed to generate code frame: ${error}`)
    return ''
  }
}

export const prepare = async (error, { color = true, root = '' } = {}) => {
  if (error && error.code === ErrorCodes.ERR_MODULE_NOT_FOUND) {
    return prepareModuleNotFoundError(error)
  }
  if (error && error.message && error.stack && error.codeFrame) {
    const cleanedStack = CleanStack.cleanStack(error.stack, { root })
    const lines = SplitLines.splitLines(cleanedStack)
    const relevantStack = lines.join('\n')
    return {
      type: error.constructor.name,
      message: error.message,
      stack: relevantStack,
      codeFrame: error.codeFrame,
    }
  }
  const message = error.message
  if (error && error.cause) {
    const cause = error.cause()
    if (cause) {
      error = cause
    }
  }
  const cleanedStack = CleanStack.cleanStack(error.stack, { root })
  const lines = SplitLines.splitLines(cleanedStack)
  const codeFrame = getCodeFrame(cleanedStack, { color })
  const relevantStack = lines.join('\n')
  return {
    type: error.constructor.name,
    message,
    stack: relevantStack,
    codeFrame,
  }
}
