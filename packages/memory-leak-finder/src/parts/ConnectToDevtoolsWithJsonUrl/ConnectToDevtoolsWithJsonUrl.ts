import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import { getJson } from '../GetJson/GetJson.ts'
import { waitForPort } from '../WaitForPort/WaitForPort.ts'

export const connectToDevtoolsWithJsonUrl = async (port: number): Promise<any> => {
  await waitForPort(port, '/json/list')
  // Fetch the JSON list from the HTTP endpoint
  const targets = await getJson(port, '/json/list')

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

  // Create connection to the WebSocket URL
  const rpc = await DebuggerCreateIpcConnection.createConnection(target.webSocketDebuggerUrl)

  return rpc
}
