const electronApps = Object.create(null)

export const get = (connectionId: string): any => {
  return electronApps[connectionId]
}

export const remove = (connectionId: string): void => {
  delete electronApps[connectionId]
}

export const set = (connectionId: string, value: any): void => {
  electronApps[connectionId] = value
}
