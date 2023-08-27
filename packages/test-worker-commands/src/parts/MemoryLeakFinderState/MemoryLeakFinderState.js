export const state = {
  instances: Object.create(null),
}

export const set = (instanceId, instance) => {
  state.instances[instanceId] = instance
}

export const get = (instanceId) => {
  return state.instances[instanceId]
}
