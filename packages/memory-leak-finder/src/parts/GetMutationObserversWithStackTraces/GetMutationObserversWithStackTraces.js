import * as GetConstructorStackTraces from '../GetConstructorStackTraces/GetConstructorStackTraces.js'

export const getMutationObserversWithStackTraces = (session, objectGroup) => {
  return GetConstructorStackTraces.getConstructorStackTraces(session, objectGroup, 'MutationObserver')
}
