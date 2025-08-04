import * as JsonRpc from '../JsonRpc/JsonRpc.js'
import * as StdoutWorker from '../StdoutWorker/StdoutWorker.js'

export const write = async (data) => {
  // TODO use invoke
  JsonRpc.send(StdoutWorker.state.ipc, 'Stdout.write', data)
}
