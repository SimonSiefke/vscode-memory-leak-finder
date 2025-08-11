export const state = {
  /**
   * @type {any}
   */
  rpc: undefined as any,
}

export const setRpc = (rpc: any): void => {
  state.rpc = rpc
}

export const send = (message: any): void => {
  // @ts-ignore
  state.rpc.send(message)
}

export const dispose = (): void => {
  if (state.rpc) {
    state.rpc.dispose()
    state.rpc = undefined
  }
}

