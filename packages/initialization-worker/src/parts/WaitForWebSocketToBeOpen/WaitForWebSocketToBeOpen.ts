const ConnectionTimeout = 5 * 60 * 1000

export const waitForWebSocketToBeOpen = async (webSocket: WebSocket): Promise<void> => {
  if (webSocket.readyState === 1) {
    return
  }
  if (webSocket.readyState !== 0) {
    throw new Error('Debugger WebSocket closed before opening')
  }
  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timeout)
      webSocket.removeEventListener('open', onOpen)
      webSocket.removeEventListener('close', onClose)
      webSocket.removeEventListener('error', onError)
    }
    const onOpen = () => {
      cleanup()
      resolve()
    }
    const fail = (message: string) => {
      cleanup()
      reject(new Error(message))
      webSocket.close()
    }
    const onClose = () => fail('Debugger WebSocket closed before opening')
    const onError = () => fail('Debugger WebSocket failed before opening')
    const timeout = setTimeout(() => {
      fail(`Timed out after ${ConnectionTimeout}ms waiting for debugger WebSocket to open`)
    }, ConnectionTimeout)
    webSocket.addEventListener('open', onOpen)
    webSocket.addEventListener('close', onClose)
    webSocket.addEventListener('error', onError)
  })
}
