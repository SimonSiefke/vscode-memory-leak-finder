import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetMapSize from '../GetMapSize/GetMapSize.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'

export const id = MeasureId.MapSize

export const targets = ['browser', 'node', 'webworker']

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetMapSize.getMapSize(session)
}

export const stop = (session, objectGroup) => {
  return GetMapSize.getMapSize(session)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
