import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import * as Json from '../Json/Json.ts'
import { VError } from '@lvce-editor/verror'
import * as WaitForWebsocketToBeOpen from '../WaitForWebSocketToBeOpen/WaitForWebSocketToBeOpen.ts'

/**
 * @param {string} wsUrl
 */
export const createConnection = async (wsUrl: string) => {
  try {
    const webSocket = new WebSocket(wsUrl)
    await WaitForWebsocketToBeOpen.waitForWebSocketToBeOpen(webSocket)
    const ipc = {
      get onmessage(): ((data: any) => void) | null {
        return webSocket.onmessage as ((data: any) => void) | null
      },
      set onmessage(listener: (data: any) => void) {
        const handleMessage = (event: MessageEvent) => {
          const parsed = JSON.parse(event.data)
          console.log(parsed)
          // @ts-ignore
          listener(parsed)
        }
        webSocket.onmessage = handleMessage
      },
      /**
       *
       * @param {any} message
       */
      send(message: any) {
        webSocket.send(Json.stringify(message))
      },
    }
    const rpc = DebuggerCreateRpcConnection.createRpc(ipc, true)
    return rpc
  } catch (error) {
    throw new VError(error, `Failed to create websocket connection`)
  }
}
