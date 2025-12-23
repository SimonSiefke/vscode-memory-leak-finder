import * as Json from '../Json/Json.ts'
import { VError } from '../VError/VError.ts'
import * as WaitForWebsocketToBeOpen from '../WaitForWebSocketToBeOpen/WaitForWebSocketToBeOpen.ts'

export const createConnection = async (wsUrl: string) => {
  try {
    const webSocket = new WebSocket(wsUrl)
    await WaitForWebsocketToBeOpen.waitForWebSocketToBeOpen(webSocket)
    return {
      dispose() {
        webSocket.close()
      },
      get onmessage() {
        return webSocket.onmessage
      },
      set onmessage(listener: ((message: unknown) => void) | null) {
        const handleMessage = (event: MessageEvent) => {
          const parsed = JSON.parse(event.data)
          // @ts-ignore
          listener(parsed)
        }
        webSocket.onmessage = handleMessage
      },
      send(message: unknown): void {
        webSocket.send(Json.stringify(message))
      },
    }
  } catch (error) {
    throw new VError(error, `Failed to create websocket connection`)
  }
}
