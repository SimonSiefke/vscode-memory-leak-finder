import * as LaunchStdoutWorker from '../LaunchStdoutWorker/LaunchStdoutWorker.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'

export const state = {
  /**
   * @type {any}
   */
  ipc: undefined,
}

export const invoke = async (method, ...params) => {
  if (!state.ipc) {
    return
  }
  JsonRpc.send(state.ipc, method, ...params)
}

export const cleanup = () => {
  if (state.ipc) {
    state.ipc.dispose()
    state.ipc = undefined
  }
}

export const prepare = async () => {
  // TODO possible race condition
  if (!state.ipc) {
    state.ipc = await LaunchStdoutWorker.launchStdoutWorker()
  }
  return state.ipc
}
