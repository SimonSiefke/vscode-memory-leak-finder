import { createRpc } from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import * as Json from '../Json/Json.ts'
import { VError } from '../VError/VError.ts'
import * as WaitForWebsocketToBeOpen from '../WaitForWebSocketToBeOpen/WaitForWebSocketToBeOpen.ts'

export const createConnection = async (wsUrl: string): Promise<any> => {
  try {
    const webSocket = new WebSocket(wsUrl)

    // TODO remove error listener and message listener when ipc is disposed
    webSocket.addEventListener('error', (error: any) => {
      throw new Error(`memory leak worker websocket error`)
    })
    await WaitForWebsocketToBeOpen.waitForWebSocketToBeOpen(webSocket as any)
    const ipc = {
      send(message: any): void {
        webSocket.send(Json.stringify(message))
      },
      get onmessage() {
        return webSocket.onmessage
      },
      set onmessage(listener) {
        const handleMessage = (event: any) => {
          const parsed = JSON.parse(event.data)
          // @ts-ignore
          listener(parsed)
        }
        webSocket.onmessage = handleMessage
      },
    }
    const rpc = createRpc(ipc)
    return rpc
  } catch (error) {
    throw new VError(error, `Failed to create websocket connection`)
  }
}
