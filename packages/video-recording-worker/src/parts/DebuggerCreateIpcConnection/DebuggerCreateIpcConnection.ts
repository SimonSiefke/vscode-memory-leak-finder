import { VError } from '../VError/VError.ts'
import * as Json from '../Json/Json.ts'
import * as WaitForWebsocketToBeOpen from '../WaitForWebSocketToBeOpen/WaitForWebSocketToBeOpen.ts'

export const createConnection = async (wsUrl: string): Promise<any> => {
  try {
    // @ts-ignore
    const webSocket = new WebSocket(wsUrl)
    // @ts-ignore
    await WaitForWebsocketToBeOpen.waitForWebSocketToBeOpen(webSocket)
    return {
      /**
       *
       * @param {any} message
       */
      send(message) {
        webSocket.send(Json.stringify(message))
      },
      get onmessage() {
        return webSocket.onmessage
      },
      set onmessage(listener) {
        const handleMessage = (event) => {
          const parsed = JSON.parse(event.data)
          // @ts-ignore
          listener(parsed)
        }
        webSocket.onmessage = handleMessage
      },
    }
  } catch (error) {
    throw new VError(error, `Failed to create websocket connection`)
  }
}
