import * as GetArrays from '../GetArrays/GetArrays.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.js'
import * as StartTrackingArrays from '../StartTrackingArrays/StartTrackingArrays.js'

export const id = MeasureId.GrowingArrays

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = async (session, objectGroup) => {
  await StartTrackingArrays.startTrackingArrays(session, objectGroup)
  return GetArrays.getArrays(session, objectGroup)
}

export const stop = async (session, objectGroup) => {
  // const stackTraces = await GetDisposableStoresWithStackTraces.getDisposableStoresWithStackTraces(session, objectGroup)
  // await StopTrackingDisposableStores.stopTrackingDisposableStores(session, objectGroup)
  // const result = await GetArrays.getArrays(session, objectGroup)
  return []
}

export const releaseResources = async (session, objectGroup) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
}

export const compare = () => {
  return {}
}

export const isLeak = ({ before, after }) => {
  return true
}
