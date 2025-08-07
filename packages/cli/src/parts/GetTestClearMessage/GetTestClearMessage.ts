const clear = '\r\u001B[K\r\u001B[1A'
const height = 2
const clearMessage = clear.repeat(height)

export const getTestClearMessage = () => {
  return clearMessage
}
