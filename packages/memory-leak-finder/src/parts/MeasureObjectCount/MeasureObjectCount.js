import * as CompareCount from '../CompareCount/CompareCount.js'
import * as GetObjectCount from '../GetObjectCount/GetObjectCount.js'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.js'

export const id = MeasureId.ObjectCount

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetObjectCount.getObjectCount(session, PrototypeExpression.Object, objectGroup)
}

export const stop = async (session, objectGroup) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
  const result = GetObjectCount.getObjectCount(session, PrototypeExpression.Object, objectGroup)
  return result
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
