import * as SplitLines from '../SplitLines/SplitLines.js'

const RE_AT = /^\s+at/
const RE_AT_PROMISE_INDEX = /^\s*at async Promise.all \(index \d+\)$/
const RE_OBJECT_AS = /^\s*at (async )?Object\.\w+ \[as ([\w\.]+)\]/
const RE_GET_RESPONSE = /^\s*at async getResponse/
const RE_WEBSOCKET_HANDLE_MESSAGE = /^\s*at async WebSocket.handleMessage/
const RE_EXECUTE_COMMAND_ASYNC = /^\s*at executeCommandAsync/
const RE_HANDLE_OTHER_MESSAGES_FROM_MESSAGE_PORT = /^\s*at async MessagePort\.handleOtherMessagesFromMessagePort/
const RE_ASSERT = /^\s*at .*\/Assert\.js/

const isInternalLine = (line) => {
  return line.includes('node:') || RE_AT_PROMISE_INDEX.test(line) || line.includes('node_modules/ws')
}

const isRelevantLine = (line) => {
  return !isInternalLine(line)
}

const isApplicationUsefulLine = (line, index) => {
  if (index === 0) {
    if (RE_ASSERT.test(line)) {
      return false
    }
    return true
  }
  if (RE_GET_RESPONSE.test(line)) {
    return false
  }
  if (RE_WEBSOCKET_HANDLE_MESSAGE.test(line)) {
    return false
  }
  if (RE_EXECUTE_COMMAND_ASYNC.test(line)) {
    return false
  }
  if (RE_HANDLE_OTHER_MESSAGES_FROM_MESSAGE_PORT.test(line)) {
    return false
  }
  return true
}

const isNormalStackLine = (line) => {
  return RE_AT.test(line) && !RE_AT_PROMISE_INDEX.test(line)
}

const cleanLine = (line) => {
  if (line.startsWith('    at exports.')) {
    return '    at ' + line.slice('    at exports.'.length)
  }
  if (line.startsWith('    at async exports.')) {
    return '    at async ' + line.slice('    at async exports.'.length)
  }
  if (line.startsWith('    at async Module.')) {
    return '    at async ' + line.slice('    at async Module.'.length)
  }
  if (line.startsWith('    at Module.')) {
    return '    at ' + line.slice('    at Module.'.length)
  }
  const objectMatch = line.match(RE_OBJECT_AS)
  if (objectMatch) {
    const rest = line.slice(objectMatch[0].length)
    if (objectMatch[1]) {
      return '    at ' + objectMatch[1] + objectMatch[2] + rest
    }
    return '    at ' + objectMatch[2] + rest
  }
  return line
}

const getDetails = (lines) => {
  const index = lines.findIndex(isNormalStackLine)
  return {
    custom: lines.slice(0, index),
    actualStack: lines.slice(index).map(cleanLine),
  }
}

const RE_PATH_1 = /^\/(.*)(\d+)$/

const mergeCustom = (custom, relevantStack) => {
  if (custom.length === 0) {
    return relevantStack
  }
  const firstLine = custom[0]
  if (RE_PATH_1.test(firstLine)) {
    return [`    at ${firstLine}`, ...relevantStack]
  }
  return relevantStack
}

export const cleanStack = (stack) => {
  const lines = SplitLines.splitLines(stack)
  const { custom, actualStack } = getDetails(lines)
  const relevantStack = actualStack.filter(isRelevantLine).filter(isApplicationUsefulLine)
  const merged = mergeCustom(custom, relevantStack)
  return merged
}
