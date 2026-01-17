import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import * as Json from '../Json/Json.ts'
import { VError } from '@lvce-editor/verror'
import * as WaitForWebsocketToBeOpen from '../WaitForWebSocketToBeOpen/WaitForWebSocketToBeOpen.ts'

/**
 * @param {string} wsUrl
 */
export const createConnection = async (wsUrl) => {
  try {
    const webSocket = new WebSocket(wsUrl)
    await WaitForWebsocketToBeOpen.waitForWebSocketToBeOpen(webSocket)
    const ipc = {
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
      /**
       *
       * @param {any} message
       */
      send(message) {
        webSocket.send(Json.stringify(message))
      },
    }
    const rpc = DebuggerCreateRpcConnection.createRpc(ipc, true)
    return rpc
  } catch (error) {
    throw new VError(error, `Failed to create websocket connection`)
  }
}
