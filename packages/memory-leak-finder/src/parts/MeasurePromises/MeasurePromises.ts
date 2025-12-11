import * as ComparePromises from '../ComparePromises/ComparePromises.ts'
import * as GetPromises from '../GetPromises/GetPromises.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import type { Session } from '../Session/Session.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.Promises

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session: Session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session: Session, objectGroup: string) => {
  return GetPromises.getPromises(session, objectGroup)
}

export const stop = (session: Session, objectGroup: string) => {
  return GetPromises.getPromises(session, objectGroup)
}

export const compare = ComparePromises.comparePromises

export const isLeak = (result) => {
  return result.after.length > result.before.length
}
