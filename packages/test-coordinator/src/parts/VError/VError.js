import * as MergeStacks from '../MergeStacks/MergeStacks.js'
import * as NormalizeErrorLine from '../NormalizeErrorLine/NormalizeErrorLine.js'

const getCombinedMessage = (error, message) => {
  const stringifiedError = NormalizeErrorLine.normalizeLine(`${error}`)
  if (message) {
    return `${message}: ${stringifiedError}`
  }
  return stringifiedError
}

export class VError extends Error {
  constructor(error, message) {
    const combinedMessage = getCombinedMessage(error, message)
    super(combinedMessage)
    this.name = 'VError'
    if (error instanceof Error) {
      this.stack = MergeStacks.mergeStacks(this.stack, error.stack)
    }
    if (error.codeFrame) {
      this.codeFrame = error.codeFrame
    }
    if (error.code) {
      this.code = error.code
    }
  }
}
