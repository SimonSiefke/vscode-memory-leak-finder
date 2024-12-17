const electronApps = Object.create(null)

export const get = (connectionId) => {
  return electronApps[connectionId]
}

export const remove = (connectionId) => {
  delete electronApps[connectionId]
}

export const set = (connectionId, value) => {
  electronApps[connectionId] = value
}
