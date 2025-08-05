export const state = {
  instances: Object.create(null),
}

export const set = (instanceId: string, instance: any): void => {
  state.instances[instanceId] = instance
}

export const get = (instanceId: string): any => {
  return state.instances[instanceId]
}
