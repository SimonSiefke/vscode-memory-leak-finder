export const state = {
  connections: Object.create(null),
}

export const get = (connectionId) => {
  return state.connections[connectionId]
}

export const set = (connectionId, connection) => {
  state.connections[connectionId] = connection
}
