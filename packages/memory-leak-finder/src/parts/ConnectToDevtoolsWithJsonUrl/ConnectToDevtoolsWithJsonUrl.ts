import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import * as CreateBunWebkitRpc from '../CreateBunWebkitRpc/CreateBunWebkitRpc.ts'
import { getJson } from '../GetJson/GetJson.ts'

const bunInspectorPath = '/memory-leak-finder'

const getWebSocketDebuggerUrl = async (port: number, runtimeName: 'bun' | 'node'): Promise<string> => {
  if (runtimeName === 'bun') {
    return `ws://127.0.0.1:${port}${bunInspectorPath}`
  }
  const targets = await getJson(port)

  if (targets.length === 0) {
    throw new Error(`No DevTools targets found on port ${port}`)
  }

  if (targets.length > 1) {
    throw new Error(`too many devtools targets found`)
  }

  // Get the first target's WebSocket URL
  const target = targets[0]
  if (!target.webSocketDebuggerUrl) {
    throw new Error(`No WebSocket URL found in DevTools target on port ${port}`)
  }

  return target.webSocketDebuggerUrl
}

export const connectToDevtoolsWithJsonUrl = async (port: number, runtimeName: 'bun' | 'node' = 'node'): Promise<any> => {
  const webSocketDebuggerUrl = await getWebSocketDebuggerUrl(port, runtimeName)
  const rpc = await DebuggerCreateIpcConnection.createConnection(webSocketDebuggerUrl)

  if (runtimeName === 'bun') {
    return CreateBunWebkitRpc.createBunWebkitRpc(rpc)
  }

  return rpc
}
