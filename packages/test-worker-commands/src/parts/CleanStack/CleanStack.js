import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as Root from '../Root/Root.js'

const isTestWorkerLine = (line) => {
  if (line.includes('test-worker/src')) {
    return true
  }
  return false
}

const isInternal = (line) => {
  if (line.includes('node:')) {
    return true
  }
  if (line.includes('default_app.asar')) {
    return true
  }
  if (line.includes('at <anonymous>')) {
    return true
  }
  if (line.includes('devtools-protocol')) {
    return true
  }
  return false
}

const isRelevant = (line) => {
  return !isInternal(line)
}

const RE_STACK_PATH_1 = /(^\s*at .*?\(?)([^()]+)(:[0-9]+:[0-9]+\)?.*$)/
const RE_STACK_PATH_2 = /(^\s*at .*?)([^()]+)(:\d+$)/

const getFilePath = (file) => {
  if (file.startsWith('file://')) {
    return fileURLToPath(file)
  }
  return file
}

const formatInjectedCodeLine = async (line, root) => {
  const stackMatch1 = line.match(RE_STACK_PATH_1)
  if (!stackMatch1) {
    return line
  }
  const lineColumn = stackMatch1[3]
  const [lineNumberString, columnNumberString] = lineColumn.slice(1, -1).split(':')
  const lineNumber = parseInt(lineNumberString)
  const columnNumber = parseInt(columnNumberString)
  const GetInjectedCodeOriginalPosition = await import('../GetInjectedCodeOriginalPosition/GetInjectedCodeOriginalPosition.js')
  const sourceMapResult = await GetInjectedCodeOriginalPosition.getInjectedCodeOriginalPosition(lineNumber, columnNumber)
  if (!sourceMapResult.source) {
    return line
  }
  const absolutePath = join(Root.root, 'packages', 'injected-code', 'dist', sourceMapResult.source)
  const relativePath = relative(root, absolutePath)
  const formattedLine = `${stackMatch1[1]}${relativePath}:${sourceMapResult.line}:${sourceMapResult.column})`
  return formattedLine
}

const formatLine = async (line, root) => {
  if (!root) {
    return line
  }
  if (line.includes('dist/injectedCode.js')) {
    return formatInjectedCodeLine(line, root)
  }
  const stackMatch1 = line.match(RE_STACK_PATH_1)
  if (stackMatch1) {
    const fileMatch = stackMatch1[2]
    const filePath = getFilePath(fileMatch)
    const relativeFilePath = relative(root, filePath)
    return stackMatch1[1] + relativeFilePath + stackMatch1[3]
  }
  const stackMatch2 = line.match(RE_STACK_PATH_2)
  if (stackMatch2) {
    const fileMatch = stackMatch2[2]
    const filePath = getFilePath(fileMatch)
    const relativeFilePath = relative(root, filePath)
    return stackMatch2[1] + relativeFilePath + stackMatch2[3]
  }
  return line
}

const formatLines = async (lines, root) => {
  const formattedLines = []
  for (const line of lines) {
    formattedLines.push(formatLine(line, root))
  }
  return await Promise.all(formattedLines)
}

const getRelevantLines = (lines, stack) => {
  const isAssertionError =
    stack.includes('AssertionError:') ||
    stack.includes('ExpectError:') ||
    stack.includes('at Module.getElectronErrorMessage') ||
    stack.includes('Target was not created page') ||
    (lines[1] && lines[1].includes('at Module.test')) ||
    stack.includes('expected') ||
    (stack.includes('at Object.evaluate ') && stack.includes('PageEvaluate/PageEvaluate.js')) ||
    (stack.includes('at Module.evaluate ') && stack.includes('PageEvaluate/PageEvaluate.js'))
  const relevantLines = []
  for (const line of lines) {
    if (isInternal(line)) {
      continue
    }
    if (isAssertionError && isTestWorkerLine(line)) {
      continue
    }
    relevantLines.push(line)
  }
  return relevantLines
}

export const cleanStack = async (stack, { root = '' } = {}) => {
  if (!stack) {
    return ''
  }
  const lines = stack.split('\n')
  const relevantLines = getRelevantLines(lines, stack)
  const formattedLines = await formatLines(relevantLines, root)
  if (formattedLines[0].startsWith('    at')) {
    return formattedLines.join('\n')
  }
  return formattedLines.slice(1).join('\n')
}
