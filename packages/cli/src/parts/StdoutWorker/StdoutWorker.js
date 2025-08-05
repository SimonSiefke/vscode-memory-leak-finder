import * as LaunchStdoutWorker from '../LaunchStdoutWorker/LaunchStdoutWorker.js'

export const state = {
  /**
   * @type {import('@lvce-editor/rpc').Rpc|undefined}
   */
  rpc: undefined,
}

export const invoke = async (method, ...params) => {
  if (!state.rpc) {
    return
  }
  state.rpc.invoke(method, ...params)
}

const cleanup = () => {
  if (state.rpc) {
    state.rpc.dispose()
    state.rpc = undefined
  }
}

export const prepare = async () => {
  // TODO possible race condition
  if (!state.rpc) {
    state.rpc = await LaunchStdoutWorker.launchStdoutWorker()
  }
  return state.rpc
}
