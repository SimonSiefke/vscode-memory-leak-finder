interface State {
  pending: any[]
}

export const state: State = {
  pending: [],
}

export const add = (object: unknown): void => {
  state.pending.push(object)
}

export const getAll = () => {
  return state.pending
}

export const clear = () => {
  state.pending = []
}
