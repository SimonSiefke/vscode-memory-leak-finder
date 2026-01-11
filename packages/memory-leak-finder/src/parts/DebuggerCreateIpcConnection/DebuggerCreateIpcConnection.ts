import { createRpc } from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import * as Json from '../Json/Json.ts'
import { VError } from '../VError/VError.ts'
import * as WaitForWebsocketToBeOpen from '../WaitForWebSocketToBeOpen/WaitForWebSocketToBeOpen.ts'

export const createConnection = async (wsUrl: string): Promise<any> => {
  try {
    const webSocket = new WebSocket(wsUrl)
    let connectionClosed = false

    const errorHandler = (error: any) => {
      connectionClosed = true
    }
    const closeHandler = () => {
      connectionClosed = true
    }

    webSocket.addEventListener('error', errorHandler)
    webSocket.addEventListener('close', closeHandler)
    await WaitForWebsocketToBeOpen.waitForWebSocketToBeOpen(webSocket as any)

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
      set onmessage(listener) {
        const handleMessage = (event: any) => {
          const parsed = JSON.parse(event.data)
          // @ts-ignore
          listener(parsed)
        }
        webSocket.onmessage = handleMessage
      },
      send(message: any): void {
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
