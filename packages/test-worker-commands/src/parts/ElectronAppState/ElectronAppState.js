export const state = {
  electronApps: Object.create(null),
}

export const get = (connectionId) => {
  return state.electronApps[connectionId]
}

export const remove = (connectionId) => {
  delete state.electronApps[connectionId]
}

export const set = (connectionId, value) => {
  state.electronApps[connectionId] = value
}
