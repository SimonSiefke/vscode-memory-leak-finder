import type { Rpc } from '@lvce-editor/rpc'

interface State {
  rpc: Rpc | undefined
}

const state: State = {
  rpc: undefined,
}

export const set = (rpc: Rpc): void => {
  state.rpc = rpc
}

export const invoke = async (method: string, ...params: unknown[]): Promise<unknown> => {
  if (!state.rpc) {
    throw new Error(`cli process rpc is not available`)
  }
  return await state.rpc.invoke(method, ...params)
}
