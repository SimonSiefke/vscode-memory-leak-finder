const clear = '\r\u001B[K\r\u001B[1A'
const height = 2
const clearMessage = clear.repeat(height)

// TODO move this to stdout worker
export const getTestClearMessage = async (): Promise<string> => {
  return clearMessage
}
