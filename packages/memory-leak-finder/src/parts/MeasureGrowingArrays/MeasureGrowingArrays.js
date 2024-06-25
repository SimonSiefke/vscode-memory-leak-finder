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
  return []
}

export const stop = async (session, objectGroup) => {
  // const stackTraces = await GetDisposableStoresWithStackTraces.getDisposableStoresWithStackTraces(session, objectGroup)
  // await StopTrackingDisposableStores.stopTrackingDisposableStores(session, objectGroup)
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
  return []
}

export const compare = () => {
  return {}
}

export const isLeak = ({ before, after }) => {
  return true
}
