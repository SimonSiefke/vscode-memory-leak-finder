export const state = {
  instances: Object.create(null),
}

export const set = (connectionId: number, instance: any): void => {
  state.instances[connectionId] = instance
}

export const get = (connectionId: number): any => {
  return state.instances[connectionId]
}
