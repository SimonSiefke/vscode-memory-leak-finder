const clear: string = '\r\u{1B}[K\r\u{1B}[1A'
const height: number = 2
const clearMessage: string = clear.repeat(height)

export const getTestClearMessage = (): string => {
  return clearMessage
}
