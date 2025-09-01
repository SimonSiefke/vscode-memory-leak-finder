const state = {
  rpc: undefined,
}

export const set = (rpc) => {
  state.rpc = rpc
}

export const dispose=async ()=>{
  if(state.rpc){
    // @ts-ignore
    await state.rpc.dispose()
    state.rpc=undefined
  }
}

const invoke = (method, ...params) => {
  if (!state.rpc) {
    throw new Error('must initialize filesystem worker')
  }
  // @ts-ignore
  return state.rpc.invoke(method, ...params)
}

export const findFiles = (pattern, options) => {
  return invoke('FileSystem.findFiles', pattern, options)
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

export const pathExists = (uri) => {
  return invoke('FileSystem.exists', uri)
}

export const makeDirectory = (uri) => {
  return invoke('FileSystem.makeDirectory', uri)
}
