import type { Session } from '../Session/Session.ts'
import * as CompareTrackedFunctions from '../CompareTrackedFunctions/CompareTrackedFunctions.ts'
import * as GetTrackedFunctions from '../GetTrackedFunctions/GetTrackedFunctions.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.TrackedFunctions

export const targets = [TargetId.Browser]

export const create = (session: Session) => {
  return [session]
}

export const start = (session: Session) => {
  return GetTrackedFunctions.getTrackedFunctions(session)
}

export const stop = (session: Session) => {
  return GetTrackedFunctions.getTrackedFunctions(session)
}

export const compare = CompareTrackedFunctions.compareTrackedFunctions
