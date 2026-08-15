import type { Session } from '../Session/Session.ts'
import * as GetGlobalPropertyNames from '../GetGlobalPropertyNames/GetGlobalPropertyNames.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.GlobalPropertyDifference

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session: Session) => {
  return [session]
}

export const start = (session: Session) => {
  return GetGlobalPropertyNames.getGlobalPropertyNames(session)
}

export const stop = (session: Session) => {
  return GetGlobalPropertyNames.getGlobalPropertyNames(session)
}

export { compareGlobalPropertyDifference as compare } from '../CompareGlobalPropertyDifference/CompareGlobalPropertyDifference.ts'

export const isLeak = (addedProperties: readonly string[]): boolean => {
  return addedProperties.length > 0
}
