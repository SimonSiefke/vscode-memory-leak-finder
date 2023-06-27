import { once } from 'node:events'
import { WebSocket } from 'ws'
import * as Json from '../Json/Json.js'
import VError from 'verror'

/**
 * @param {string} wsUrl
 */
export const createConnection = async (wsUrl) => {
  try {
    const webSocket = new WebSocket(wsUrl)
    await once(webSocket, 'open')
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
