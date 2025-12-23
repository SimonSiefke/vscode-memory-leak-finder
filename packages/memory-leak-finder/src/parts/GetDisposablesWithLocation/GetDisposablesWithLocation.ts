import * as GetDisposableLocations from '../GetDisposableLocations/GetDisposableLocations.ts'
import * as GetDisposables from '../GetDisposables/GetDisposables.ts'
import type { Session } from '../Session/Session.ts'

export const getDisposablesWithLocation = async (session: Session, objectGroup, scriptMap) => {
  const disposables = await GetDisposables.getDisposables(session, objectGroup)
  const cleanLocations = await GetDisposableLocations.getDisposableLocations(session, objectGroup, disposables)
  return cleanLocations
}
