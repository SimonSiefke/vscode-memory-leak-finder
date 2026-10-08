import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import * as Json from '../Json/Json.ts'
import { VError } from '../VError/VError.ts'
import * as WaitForWebsocketToBeOpen from '../WaitForWebSocketToBeOpen/WaitForWebSocketToBeOpen.ts'

/**
 * @param {string} wsUrl
 */
export const createConnection = async (wsUrl: string) => {
  try {
    const webSocket = new WebSocket(wsUrl)
    await WaitForWebsocketToBeOpen.waitForWebSocketToBeOpen(webSocket)
    const ipc: Parameters<typeof DebuggerCreateRpcConnection.createRpc>[0] = {
      get onmessage() {
        return webSocket.onmessage as unknown as ((message: unknown) => void) | null
      },
      set onmessage(listener: ((message: unknown) => void) | null) {
        const handleMessage = (event: any) => {
          const parsed = JSON.parse(event.data)
          // @ts-ignore
          listener?.(parsed)
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
