export const state = {
  interMediateConnections: Object.create(null),
}

export const get = (connectionId: string): any => {
  return state.interMediateConnections[connectionId]
}

export const remove = (connectionId: string): void => {
  delete state.interMediateConnections[connectionId]
}

export const set = (connectionId: string, connection: any): void => {
  state.interMediateConnections[connectionId] = connection
}
