const clear = '\r\x1B[K\r\x1B[1A'
const height = 2
const clearMessage = clear.repeat(height)

export const getTestClearMessage = () => {
  return clearMessage
}
