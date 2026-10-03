import type { Dynamic } from '../Types/Types.ts'
import type { Session } from '../Session/Session.ts'
import * as GetDisposableLocations from '../GetDisposableLocations/GetDisposableLocations.ts'
import * as GetDisposables from '../GetDisposables/GetDisposables.ts'
export const getDisposablesWithLocation = async (session: Session, objectGroup: Dynamic, scriptMap: Dynamic) => {
  const disposables = await GetDisposables.getDisposables(session, objectGroup)
  const cleanLocations = await GetDisposableLocations.getDisposableLocations(session, objectGroup, disposables)
  return cleanLocations
}
