import * as JsonRpcEvent from '../JsonRpcEvent/JsonRpcEvent.js'

export const send = (transport, method, ...params) => {
  const message = JsonRpcEvent.create(method, params)
  transport.send(message)
}
