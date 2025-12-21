const snapshots = Object.create(null)

export const set = (id, value) => {
  snapshots[id] = value
}

export const get = (id) => {
  const value = snapshots[id]
  delete snapshots[id]
  return value
}

export const dispose = (id) => {
  delete snapshots[id]
}
