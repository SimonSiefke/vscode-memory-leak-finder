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
  if (line.includes('devtools-protocol')) {
    return true
  }
  if (line.includes('at restoreJsonRpcError')) {
    return true
  }
  if (line.includes('at unwrapJsonRpcResult')) {
    return true
  }
  if (line.includes('at async handleJsonRpcMessage')) {
    return true
  }
  if (line.includes('at invoke ') && line.includes('JsonRpc/JsonRpc.js')) {
    return true
  }
  return false
}

const cleanLine = (line) => {
  const trimmedLine = line.trim()
  if (trimmedLine.startsWith('at Module.')) {
    return line.replace('at Module.', 'at ')
  }
  if (trimmedLine.startsWith('at Object.')) {
    return line.replace('at Object.', 'at ')
  }
  if (trimmedLine.startsWith('at async Object.')) {
    return line.replace('at async Object.', 'at async ')
  }
  if (trimmedLine.startsWith('at async Module.')) {
    return line.replace('at async Module.', 'at async ')
  }
  return line
}

const getCleanLines = (lines) => {
  return lines.map(cleanLine)
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

export const cleanStack = (stack, { root = '' } = {}) => {
  if (!stack) {
    return ''
  }
  const lines = stack.split('\n')
  const relevantLines = getRelevantLines(lines, stack)
  const cleanLines = getCleanLines(relevantLines)
  if (cleanLines[0].startsWith('    at')) {
    return cleanLines.join('\n')
  }
  return cleanLines.slice(1).join('\n')
}
