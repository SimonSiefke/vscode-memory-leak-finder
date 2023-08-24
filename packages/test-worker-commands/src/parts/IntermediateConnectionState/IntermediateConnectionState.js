export const state = {
  interMediateConnections: Object.create(null),
}

export const get = (connectionId) => {
  return state.interMediateConnections[connectionId]
}

export const remove = (connectionId) => {
  delete state.interMediateConnections[connectionId]
}

export const set = (connectionId, connection) => {
  state.interMediateConnections[connectionId] = connection
}
