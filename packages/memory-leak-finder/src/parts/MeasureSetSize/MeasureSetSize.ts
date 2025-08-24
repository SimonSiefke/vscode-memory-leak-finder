import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetSetSize from '../GetSetSize/GetSetSize.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'

export const id = MeasureId.SetSize

export const targets = ['browser', 'node', 'webworker']

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetSetSize.getSetSize(session)
}

export const stop = (session, objectGroup) => {
  return GetSetSize.getSetSize(session)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
