export const state = {
  id: 0,
}

export const create = () => {
  return ++state.id
}
