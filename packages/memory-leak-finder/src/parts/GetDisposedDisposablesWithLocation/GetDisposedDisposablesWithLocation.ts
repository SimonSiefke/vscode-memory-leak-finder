import * as GetDisposableLocations from '../GetDisposableLocations/GetDisposableLocations.ts'
import * as GetDisposedDisposables from '../GetDisposedDisposables/GetDisposedDisposables.ts'

export const getDisposedDisposablesWithLocation = async (session, objectGroup, scriptMap) => {
  const disposables = await GetDisposedDisposables.getDisposedDisposables(session, objectGroup)
  const cleanLocations = await GetDisposableLocations.getDisposableLocations(session, objectGroup, disposables)
  return cleanLocations
}
