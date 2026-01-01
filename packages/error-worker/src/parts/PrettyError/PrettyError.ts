import { codeFrameColumns } from '@babel/code-frame'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import * as CleanStack from '../CleanStack/CleanStack.ts'
import * as ErrorCodes from '../ErrorCodes/ErrorCodes.ts'
import * as FileSystem from '../FileSystem/FileSystem.ts'
import * as PrettyStack from '../PrettyStack/PrettyStack.ts'
import * as SplitLines from '../SplitLines/SplitLines.ts'

const getActualPath = (fileUri: string): string => {
  if (fileUri.startsWith('file://')) {
    return fileURLToPath(fileUri)
  }
  return fileUri
}

const RE_MODULE_NOT_FOUND_STACK = /Cannot find package '([^']+)' imported from (.+)$/

const prepareModuleNotFoundError = (error: Error): { codeFrame: string; message: string; stack: string } => {
  const { message } = error
  const match = message.match(RE_MODULE_NOT_FOUND_STACK)
  if (!match) {
    return {
      codeFrame: '',
      message,
      stack: error.stack || '',
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
      column,
      line,
    },
  }
  const codeFrame = codeFrameColumns(rawLines, location, { highlightCode: false })
  const stackLines = SplitLines.splitLines(error.stack || '')
  const newStackLines = [stackLines[0], `    at ${importedFrom}:${line}:${column}`, ...stackLines.slice(1)]
  const newStack = newStackLines.join('\n')
  return {
    codeFrame,
    message,
    stack: newStack,
  }
}

const getPathDetails = (lines: string[]): { column: number; line: number; path: string } | undefined => {
  for (let i = 0; i < lines.length; i++) {
    const file = lines[i]
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
          column: Number.parseInt(column),
          line: Number.parseInt(line),
          path: actualPath,
        }
      }
    }
  }
  return undefined
}

const getCodeFrame = (cleanedStack: string, { color }: { color: boolean }): string => {
  try {
    const lines = SplitLines.splitLines(cleanedStack)
    const pathDetails = getPathDetails(lines)
    if (!pathDetails) {
      return ''
    }
    const { column, line, path } = pathDetails
    const actualPath = getActualPath(path)
    const rawLines = FileSystem.readFileSync(actualPath, 'utf8')
    const location = {
      start: {
        column: column,
        line: line,
      },
    }
    const codeFrame = codeFrameColumns(rawLines, location, { forceColor: color, highlightCode: color })
    return codeFrame
  } catch (error) {
    console.warn(`failed to generate code frame: ${error}`)
    return ''
  }
}

interface PrepareOptions {
  readonly color?: boolean
  readonly root?: string
}

interface PrepareResult {
  readonly codeFrame: string
  readonly message: string
  readonly stack: string
  readonly type: string
}

export const prepare = async (error: Error, { color = true, root = '' }: PrepareOptions = {}): Promise<PrepareResult> => {
  if (error && (error as any).code === ErrorCodes.ERR_MODULE_NOT_FOUND) {
    // @ts-ignore
    return prepareModuleNotFoundError(error)
  }
  if (error && error.message && error.stack && (error as any).codeFrame) {
    const cleanedStack = CleanStack.cleanStack(error.stack, { root })
    const lines = SplitLines.splitLines(cleanedStack)
    const relevantStack = lines.join('\n')
    return {
      codeFrame: (error as any).codeFrame,
      message: error.message,
      stack: relevantStack,
      type: error.constructor.name,
    }
  }
  const { message } = error
  let currentError: Error = error
  if (error && (error as any).cause) {
    const cause = (error as any).cause()
    if (cause) {
      currentError = cause
    }
  }
  const cleanedStack = CleanStack.cleanStack(currentError.stack || '', { root })
  const lines = SplitLines.splitLines(cleanedStack)
  const codeFrame = getCodeFrame(cleanedStack, { color })
  const prettyStack = PrettyStack.prettyStack(lines, root)
  const relevantStack = prettyStack.join('\n')
  return {
    codeFrame,
    message,
    stack: relevantStack,
    type: currentError.constructor.name,
  }
}
