export const state: {
  id: number
} = {
  id: 1,
}

export const create = (): string => {
  return String(state.id++)
}
