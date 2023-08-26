import * as JsonRpc from '../JsonRpc/JsonRpc.js'

export const state = {
  ipc: undefined,
}

export const setIpc = (ipc) => {
  state.ipc = ipc
}

export const send = (method, ...params) => {
  JsonRpc.send(state.ipc, method, ...params)
}
