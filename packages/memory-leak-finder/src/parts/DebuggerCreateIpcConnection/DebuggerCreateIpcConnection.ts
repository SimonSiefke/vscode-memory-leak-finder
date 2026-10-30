import type { Dynamic } from '../Types/Types.ts'
import { createRpc } from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import * as Json from '../Json/Json.ts'
import { VError } from '../VError/VError.ts'
import * as WaitForWebsocketToBeOpen from '../WaitForWebSocketToBeOpen/WaitForWebSocketToBeOpen.ts'
export const createConnection = async (wsUrl: string, { connectionTimeoutMs = 0, requestTimeoutMs = 0 } = {}): Promise<Dynamic> => {
  try {
    const webSocket = new WebSocket(wsUrl)
    let connectionClosed = false
    let onclose: (() => void) | undefined
    const errorHandler = (error: Dynamic) => {
      connectionClosed = true
      onclose?.()
    }
    const closeHandler = () => {
      connectionClosed = true
      onclose?.()
    }
    webSocket.addEventListener('error', errorHandler)
    webSocket.addEventListener('close', closeHandler)
    let timer: NodeJS.Timeout | undefined
    try {
      const opened = WaitForWebsocketToBeOpen.waitForWebSocketToBeOpen(webSocket as Dynamic)
      await (connectionTimeoutMs
        ? Promise.race([
            opened,
            new Promise<void>((_, reject) => {
              timer = setTimeout(() => reject(new Error('DevTools connection timed out')), connectionTimeoutMs)
            }),
          ])
        : opened)
    } catch (error) {
      webSocket.close()
      webSocket.removeEventListener('error', errorHandler)
      webSocket.removeEventListener('close', closeHandler)
      throw error
    } finally {
      clearTimeout(timer)
    }
    const ipc = {
      get connectionClosed() {
        return connectionClosed
      },
      set onclose(listener: () => void) {
        onclose = listener
      },
      dispose() {
        connectionClosed = true
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
    const rpc = createRpc(ipc, { requestTimeoutMs })
    // Wrap rpc to include connectionClosed flag
    return {
      ...rpc,
      connectionClosed: () => connectionClosed,
    }
  } catch (error) {
    throw new VError(error, `Failed to create websocket connection`)
  }
}
