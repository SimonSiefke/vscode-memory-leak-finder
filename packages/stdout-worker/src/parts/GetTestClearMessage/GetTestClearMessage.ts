const clear: string = '\r\u001B[K\r\u001B[1A'
const height: number = 2
const clearMessage: string = clear.repeat(height)

export const getTestClearMessage = (): string => {
  return clearMessage
}
