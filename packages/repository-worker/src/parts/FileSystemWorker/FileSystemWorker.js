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

export const readFileContent = (path) => {
  return invoke('FileSystem.readFileContent', path)
}

export const exec = (command, args, options) => {
  return invoke('FileSystem.exec', command, args, options)
}

export const applyFileOperations = (operations) => {
  return invoke('FileSystem.applyFileOperations', operations)
}
