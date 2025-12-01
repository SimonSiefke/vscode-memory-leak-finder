import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetStoredPromiseCount from '../GetStoredPromiseCount/GetStoredPromiseCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.StoredPromiseCount

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetStoredPromiseCount.getStoredPromiseCount(session, objectGroup)
}

export const stop = (session, objectGroup) => {
  return GetStoredPromiseCount.getStoredPromiseCount(session, objectGroup)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
