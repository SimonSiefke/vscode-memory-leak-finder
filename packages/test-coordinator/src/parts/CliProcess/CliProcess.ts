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

export const invoke = async (method, ...params) => {
  if (!state.rpc) {
    throw new Error(`cli process rpc is not available`)
  }
  await state.rpc.invoke(method, ...params)
}
