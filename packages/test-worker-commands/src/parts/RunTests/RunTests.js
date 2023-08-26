import * as Assert from '../Assert/Assert.js'
import * as ConnectionState from '../ConnectionState/ConnectionState.js'

export const runTests = async (connectionId, formattedPaths) => {
  Assert.number(connectionId)
  Assert.array(formattedPaths)
  const connection = ConnectionState.get(connectionId)
  if (!connection) {
    throw new Error(`no debug websocket connection found`)
  }
  console.log('running tests', formattedPaths)
}
