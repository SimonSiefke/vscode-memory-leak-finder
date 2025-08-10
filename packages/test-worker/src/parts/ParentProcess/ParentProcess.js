export const state = {
  /**
   * @type {any}
   */
  rpc: undefined,
}

export const setRpc = (ipc) => {
  state.rpc = ipc
}

export const send = (message) => {
  // @ts-ignore
  state.rpc.send(message)
}

export const dispose = () => {
  if (state.rpc) {
    state.rpc.dispose()
    state.rpc = undefined
  }
}
