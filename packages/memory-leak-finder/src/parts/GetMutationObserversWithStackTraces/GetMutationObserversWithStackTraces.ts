import type { Session } from '../Session/Session.ts'
import * as ConstructorKey from '../ConstructorKey/ConstructorKey.ts'
import * as GetConstructorStackTraces from '../GetConstructorStackTraces/GetConstructorStackTraces.ts'

export const getMutationObserversWithStackTraces = (session: Session, objectGroup: string) => {
  return GetConstructorStackTraces.getConstructorStackTraces(session, objectGroup, ConstructorKey.MutationObserver)
}
