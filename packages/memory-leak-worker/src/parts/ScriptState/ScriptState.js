export const state = {
  scriptMapMap: Object.create(null),
}

export const get = (id) => {
  return state.scriptMapMap[id]
}

export const set = (id, value) => {
  state.scriptMapMap[id] = value
}
