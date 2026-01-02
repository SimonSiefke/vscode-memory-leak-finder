import * as JsonRpcEvent from '../JsonRpcEvent/JsonRpcEvent.js'

/**
 * @param {{ send: (message: unknown) => void }} transport
 * @param {string} method
 * @param {...unknown} params
 */
export const send = (transport, method, ...params) => {
  const message = JsonRpcEvent.create(method, params)
  transport.send(message)
}
