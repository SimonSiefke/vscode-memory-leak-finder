import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.js'
import * as StartTrackingFunctions from '../StartTrackingFunctions/StartTrackingFunctions.js'
import * as StopTrackingFunctions from '../StopTrackingFunctions/StopTrackingFunctions.js'
import * as CompareFunctionDifference from '../CompareFunctionDifference/CompareFunctionDifference.js'

export const id = MeasureId.FunctionDifference

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return StartTrackingFunctions.startTrackingFunctions(session, objectGroup)
}

export const stop = async (session, objectGroup) => {
  const result = await StopTrackingFunctions.stopTrackingFunctions(session, objectGroup)
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
  console.log({ result })
  return result
}

export const compare = CompareFunctionDifference.compareFunctionDifference

export const isLeak = () => {
  return false
}
