import * as GetArrayElementCount from '../GetArrayElementCount/GetArrayElementCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

export const id = MeasureId.ArrayElementCount

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetArrayElementCount.getArrayElementCount(session, objectGroup)
}

export const stop = async (session, objectGroup) => {
  const result = await GetArrayElementCount.getArrayElementCount(session, objectGroup)
  return result
}

export const releaseResources = async (session, objectGroup) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
}

export const compare = (before, after) => {
  return {
    before,
    after,
  }
}

export const isLeak = ({ before, after }) => {
  return after > before
}
