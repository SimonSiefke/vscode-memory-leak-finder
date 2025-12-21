export const state = {
  instances: Object.create(null),
}

export const set = (connectionId: number, instance: any): void => {
  state.instances[connectionId] = instance
}

export const get = (connectionId: number): any => {
  return state.instances[connectionId]
}

export const update = (connectionId: number, update: any): void => {
  const existing = get(connectionId)
  const updated = { ...existing, ...update }
  set(connectionId, updated)
}
