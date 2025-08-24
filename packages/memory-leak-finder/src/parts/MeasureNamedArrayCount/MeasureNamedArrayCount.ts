import * as CompareNamedArrayCountDifference from '../CompareNamedArrayCountDifference/CompareNamedArrayCountDifference.ts'
import * as GetNamedArrayCount from '../GetNamedArrayCount/GetNamedArrayCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'

export const id = MeasureId.NamedArrayCount

export const targets = ['browser', 'node', 'webworker']

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = async (session, objectGroup) => {
  const id = 0
  return GetNamedArrayCount.getNamedArrayCount(session, objectGroup, id)
}

export const stop = async (session, objectGroup) => {
  const id = 1
  return GetNamedArrayCount.getNamedArrayCount(session, objectGroup, id)
}

export const releaseResources = async (session, objectGroup) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
}

export const compare = CompareNamedArrayCountDifference.compareNamedArrayCountDifference

export const isLeak = (leaked) => {
  return leaked.length > 0
}
