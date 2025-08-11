import type { Rpc } from '@lvce-editor/rpc'

interface State {
  rpc: Rpc | undefined
}

const state: State = {
  rpc: undefined,
}

export const set = (rpc) => {
  state.rpc = rpc
}

export const send = (method, ...params) => {
  if (!state.rpc) {
    return
  }
  state.rpc.send(method, ...params)
}

export const invoke = (method, ...params) => {
  if (!state.rpc) {
    return
  }
  state.rpc.invoke(method, ...params)
}
