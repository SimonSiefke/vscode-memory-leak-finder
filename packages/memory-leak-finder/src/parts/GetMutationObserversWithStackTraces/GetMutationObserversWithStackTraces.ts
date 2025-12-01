import * as ConstructorKey from '../ConstructorKey/ConstructorKey.ts'
import * as GetConstructorStackTraces from '../GetConstructorStackTraces/GetConstructorStackTraces.ts'

export const getMutationObserversWithStackTraces = (session, objectGroup) => {
  return GetConstructorStackTraces.getConstructorStackTraces(session, objectGroup, ConstructorKey.MutationObserver)
}
