import { relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as Assert from '../Assert/Assert.js'

const RE_STACK_PATH_1 = /(^\s*at .*?\(?)([^()]+)(:[0-9]+:[0-9]+\)?.*$)/
const RE_STACK_PATH_2 = /(^\s*at .*?)([^()]+)(:\d+$)/
const RE_AT = /^\s*at/

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

export const prettyStack = (lines, root) => {
  Assert.array(lines)
  Assert.string(root)
  const newLines = []
  for (const line of lines) {
    newLines.push(formatLine(line, root))
  }
  if (newLines[0] && !RE_AT.test(newLines[0])) {
    return newLines.slice(1)
  }
  return newLines
}
