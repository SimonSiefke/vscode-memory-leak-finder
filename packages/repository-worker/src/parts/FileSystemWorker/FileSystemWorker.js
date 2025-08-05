const state = {
  rpc: undefined,
}

export const set = (rpc) => {
  state.rpc = rpc
}

const invoke = (method, ...params) => {
  if (!state.rpc) {
    return
  }
  // @ts-ignore
  return state.rpc.invoke(method, ...params)
}

export const findFiles = () => {
  return invoke('FileSystem.findFiles')
}

export const readFileContent = () => {
  return invoke('FileSystem.readFileContent')
}

export const exec = () => {
  return invoke('FileSystem.exec')
}
