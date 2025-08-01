import { WebSocket } from 'ws'
import { VError } from '../VError/VError.js'
import * as Json from '../Json/Json.js'
import * as WaitForWebsocketToBeOpen from '../WaitForWebSocketToBeOpen/WaitForWebSocketToBeOpen.js'

/**
 * @param {string} wsUrl
 */
export const createConnection = async (wsUrl) => {
  try {
    const webSocket = new WebSocket(wsUrl)
    webSocket.on('error', (error) => {
      throw new Error(`memory leak worker websocket error: ${error}`)
    })
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
