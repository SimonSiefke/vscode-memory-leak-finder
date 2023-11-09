import * as CompareCount from '../CompareCount/CompareCount.js'
import * as GetMapSize from '../GetMapSize/GetMapSize.js'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

export const id = MeasureId.MapSize

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
