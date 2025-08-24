import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetWeakSetCount from '../GetWeakSetCount/GetWeakSetCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'

export const id = MeasureId.WeakSetCount

export const targets = ['browser', 'node', 'webworker']

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetWeakSetCount.getWeakSetCount(session)
}

export const stop = (session, objectGroup) => {
  return GetWeakSetCount.getWeakSetCount(session)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
