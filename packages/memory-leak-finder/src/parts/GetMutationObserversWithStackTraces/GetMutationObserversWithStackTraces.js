import * as GetConstructorStackTraces from '../GetConstructorStackTraces/GetConstructorStackTraces.js'
import * as ConstructorKey from '../ConstructorKey/ConstructorKey.js'

export const getMutationObserversWithStackTraces = (session, objectGroup) => {
  return GetConstructorStackTraces.getConstructorStackTraces(session, objectGroup, ConstructorKey.MutationObserver)
}
