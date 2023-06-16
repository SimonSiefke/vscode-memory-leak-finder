import * as MergeStacks from '../MergeStacks/MergeStacks.js'

const splitMessageAndStack = (input) => {
  const lines = input.split('\n')
  if (lines.length === 1) {
    return {
      message: input,
      stack: '',
    }
  }
  if (lines[1].startsWith('    at ')) {
    return {
      message: lines[0],
      stack: lines.slice(1).join('\n'),
    }
  }
  return {
    message: input,
    stack: '',
  }
}

export class DevtoolsProtocolError extends Error {
  constructor(input) {
    const { message, stack } = splitMessageAndStack(input)
    super(message)
    this.name = 'DevtoolsProtocolError'
    if (stack) {
      this.stack = MergeStacks.mergeStacks(this.stack, stack)
    }
  }
}
