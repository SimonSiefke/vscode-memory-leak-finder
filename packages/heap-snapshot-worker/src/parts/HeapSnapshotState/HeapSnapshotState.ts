const snapshots = Object.create(null)

export const set = (id: any, value: any) => {
  snapshots[id] = value
}

export const get = (id: any) => {
  const value = snapshots[id]
  delete snapshots[id]
  return value
}

export const dispose = (id: any) => {
  delete snapshots[id]
}
