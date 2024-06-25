import * as GetDisposableLocations from '../GetDisposableLocations/GetDisposableLocations.js'
import * as GetDisposedDisposables from '../GetDisposedDisposables/GetDisposedDisposables.js'

export const getDisposedDisposablesWithLocation = async (session, objectGroup, scriptMap) => {
  const disposables = await GetDisposedDisposables.getDisposedDisposables(session, objectGroup)
  const cleanLocations = await GetDisposableLocations.getDisposableLocations(session, objectGroup, disposables)
  return cleanLocations
}
