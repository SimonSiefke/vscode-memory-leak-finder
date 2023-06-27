export const state = {
  /**
   * @type {any}
   */
  ipc: undefined,
}

export const setIpc = (ipc) => {
  state.ipc = ipc
}

export const send = (message) => {
  // @ts-ignore
  state.ipc.send(message)
}

export const dispose = () => {
  if (state.ipc) {
    state.ipc.dispose()
    state.ipc = undefined
  }
}
