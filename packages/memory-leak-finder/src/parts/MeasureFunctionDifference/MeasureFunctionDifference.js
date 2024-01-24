import * as CompareFunctionDifference from '../CompareFunctionDifference/CompareFunctionDifference.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.js'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.js'
import * as StartTrackingFunctions from '../StartTrackingFunctions/StartTrackingFunctions.js'
import * as StopTrackingFunctions from '../StopTrackingFunctions/StopTrackingFunctions.js'

export const id = MeasureId.FunctionDifference

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  const scriptHandler = ScriptHandler.create()
  return [session, objectGroup, scriptHandler]
}

export const start = async (session, objectGroup, scriptHandler) => {
  await scriptHandler.start(session)
  return StartTrackingFunctions.startTrackingFunctions(session, objectGroup)
}

export const stop = async (session, objectGroup, scriptHandler) => {
  await scriptHandler.stop(session)
  const result = await StopTrackingFunctions.stopTrackingFunctions(session, objectGroup)
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
  return {
    result,
    scriptMap: scriptHandler.scriptMap,
  }
}

export const compare = CompareFunctionDifference.compareFunctionDifference

export const isLeak = () => {
  return false
}
