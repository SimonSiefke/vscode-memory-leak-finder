import type { Dynamic } from '../Types/Types.ts'
import { createRpc } from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import * as Json from '../Json/Json.ts'
import { VError } from '../VError/VError.ts'
import * as WaitForWebsocketToBeOpen from '../WaitForWebSocketToBeOpen/WaitForWebSocketToBeOpen.ts'
export const createConnection = async (wsUrl: string): Promise<Dynamic> => {
  try {
    const webSocket = new WebSocket(wsUrl)
    let connectionClosed = false
    const errorHandler = (error: Dynamic) => {
      connectionClosed = true
    }
    const closeHandler = () => {
      connectionClosed = true
    }
    webSocket.addEventListener('error', errorHandler)
    webSocket.addEventListener('close', closeHandler)
    await WaitForWebsocketToBeOpen.waitForWebSocketToBeOpen(webSocket as Dynamic)
    const ipc = {
      get connectionClosed() {
        return connectionClosed
      },
      dispose() {
        webSocket.removeEventListener('error', errorHandler)
        webSocket.removeEventListener('close', closeHandler)
        webSocket.onmessage = null
        webSocket.close()
      },
      get onmessage() {
        return webSocket.onmessage
      },
      set onmessage(listener: Dynamic) {
        const handleMessage = (event: Dynamic) => {
          const parsed = JSON.parse(event.data)
          // @ts-ignore
          listener(parsed)
        }
        webSocket.onmessage = handleMessage
      },
      send(message: Dynamic): void {
        if (connectionClosed) {
          return
        }
        webSocket.send(Json.stringify(message))
      },
    }
    const rpc = createRpc(ipc)
    // Wrap rpc to include connectionClosed flag
    return {
      ...rpc,
      connectionClosed: () => connectionClosed,
    }
  } catch (error) {
    throw new VError(error, `Failed to create websocket connection`)
  }
}
