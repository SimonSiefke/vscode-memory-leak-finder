import type { Rpc } from '@lvce-editor/rpc'
import * as LaunchStdoutWorker from '../LaunchStdoutWorker/LaunchStdoutWorker.ts'

interface State {
  rpc: Rpc | undefined
}

export const state: State = {
  rpc: undefined,
}

export const invoke = async (method, ...params) => {
  if (!state.rpc) {
    return
  }
  state.rpc.invoke(method, ...params)
}

export const cleanup = () => {
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
