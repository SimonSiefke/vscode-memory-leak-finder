import * as TestClearMessageState from '../TestClearMessageState/TestClearMessageState.js'

const clear = '\r\x1B[K\r\x1B[1A'

export const getTestClearMessage = () => {
  const lineCount = 2
  const clearMessage = clear.repeat(lineCount)
  return clearMessage
}
