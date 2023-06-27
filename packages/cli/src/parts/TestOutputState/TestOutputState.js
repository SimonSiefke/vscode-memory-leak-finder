export const state = {
  /**
   * @type {any[]}
   */
  pending: [],
}

export const add = (object) => {
  state.pending.push(object)
}

export const getAll = () => {
  return state.pending
}

export const clear = () => {
  state.pending = []
}
