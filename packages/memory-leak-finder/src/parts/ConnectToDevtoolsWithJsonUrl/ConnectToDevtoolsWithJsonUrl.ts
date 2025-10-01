import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export const connectToDevtoolsWithJsonUrl = async (port: number): Promise<any> => {
  // Fetch the JSON list from the HTTP endpoint
  const response = await fetch(`http://localhost:${port}/json/list`)
  if (!response.ok) {
    throw new Error(`Failed to fetch DevTools JSON list from port ${port}: ${response.status} ${response.statusText}`)
  }

  const targets = await response.json()
  if (!Array.isArray(targets) || targets.length === 0) {
    throw new Error(`No DevTools targets found on port ${port}`)
  }

  // Get the first target's WebSocket URL
  const target = targets[0]
  if (!target.webSocketDebuggerUrl) {
    throw new Error(`No WebSocket URL found in DevTools target on port ${port}`)
  }

  console.log(`[Memory Leak Finder] Connecting to DevTools WebSocket: ${target.webSocketDebuggerUrl}`)

  // Create connection to the WebSocket URL
  const rpc = await DebuggerCreateIpcConnection.createConnection(target.webSocketDebuggerUrl)

  // Enable runtime and run if waiting for debugger
  await Promise.all([
    DevtoolsProtocolRuntime.enable(rpc),
    DevtoolsProtocolRuntime.runIfWaitingForDebugger(rpc),
  ])

  return rpc
}
