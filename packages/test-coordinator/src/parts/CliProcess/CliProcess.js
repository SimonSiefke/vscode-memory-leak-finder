const state = {
  /**
   * @type {import('@lvce-editor/rpc').Rpc|undefined}
   */
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
