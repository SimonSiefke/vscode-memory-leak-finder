import { VError } from '@lvce-editor/verror'

export const createConnection = async (wsUrl: string) => {
  try {
    // @ts-ignore
    const webSocket = new WebSocket(wsUrl)
    await new Promise<void>((resolve, reject) => {
      if (webSocket.readyState === WebSocket.OPEN) {
        resolve()
        return
      }
      webSocket.addEventListener('open', () => resolve(), { once: true })
      webSocket.addEventListener('error', (error) => reject(error), { once: true })
    })
    return {
      dispose() {
        webSocket.close()
      },
      get onmessage() {
        return webSocket.onmessage
      },
      set onmessage(listener: ((this: WebSocket, ev: MessageEvent) => void) | null) {
        const handleMessage = (event: MessageEvent) => {
          const parsed = JSON.parse(event.data)
          // @ts-ignore
          listener(parsed)
        }
        webSocket.onmessage = handleMessage
      },
      send(message: unknown): void {
        webSocket.send(JSON.stringify(message))
      },
    }
  } catch (error) {
    throw new VError(error, `Failed to create websocket connection`)
  }
}
