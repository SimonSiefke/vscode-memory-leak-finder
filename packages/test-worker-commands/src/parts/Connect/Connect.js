import * as Assert from '../Assert/Assert.js'
import * as ConnectionState from '../ConnectionState/ConnectionState.js'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.js'

export const connect = async (connectionId, webSocketUrl) => {
  Assert.number(connectionId)
  Assert.string(webSocketUrl)
  const ipc = await DebuggerCreateIpcConnection.createConnection(webSocketUrl)
  ConnectionState.set(connectionId, ipc)
}
