import { relative } from 'node:path'
import { fileURLToPath } from 'node:url'

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
  return false
}

const RE_STACK_PATH_1 = /(^\s*at .*?\(?)([^()]+)(:[0-9]+:[0-9]+\)?.*$)/
const RE_STACK_PATH_2 = /(^\s*at .*?)([^()]+)(:\d+$)/

const getFilePath = (file) => {
  if (file.startsWith('file://')) {
    return fileURLToPath(file)
  }
  return file
}

const formatLine = (line, root) => {
  if (!root) {
    return line
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

const formatLines = (lines, root) => {
  const formattedLines = []
  for (const line of lines) {
    formattedLines.push(formatLine(line, root))
  }
  return formattedLines
}

const getRelevantLines = (lines, stack) => {
  const isAssertionError =
    stack.includes('AssertionError:') ||
    stack.includes('ExpectError:') ||
    stack.includes('at Module.getElectronErrorMessage') ||
    stack.includes('Target was not created page') ||
    lines[1].includes('at Module.test') ||
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

export const cleanStack = (stack, { root = '' } = {}) => {
  if (!stack) {
    return ''
  }
  const lines = stack.split('\n')
  const relevantLines = getRelevantLines(lines, stack)
  const formattedLines = formatLines(relevantLines, root)
  if (formattedLines[0].startsWith('    at')) {
    return formattedLines.join('\n')
  }
  return formattedLines.slice(1).join('\n')
}
