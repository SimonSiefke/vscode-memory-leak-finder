const state = {
  /**
   * @type {any}
   */
  rpc: undefined as any,
}

export const setRpc = (rpc: any): void => {
  state.rpc = rpc
}

const send = (message: any): void => {
  // @ts-ignore
  state.rpc.send(message)
}

const dispose = (): void => {
  if (state.rpc) {
    state.rpc.dispose()
    state.rpc = undefined
  }
}
