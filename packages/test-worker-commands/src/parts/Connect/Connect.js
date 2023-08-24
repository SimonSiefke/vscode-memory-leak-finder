import * as Assert from '../Assert/Assert.js'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.js'

export const connect = async (webSocketUrl) => {
  Assert.string(webSocketUrl)
  const ipc = await DebuggerCreateIpcConnection.createConnection(webSocketUrl)
  console.log({ ipc })
}
