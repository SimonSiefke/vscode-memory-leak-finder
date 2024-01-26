import * as CompareFunctionDifference from '../CompareFunctionDifference/CompareFunctionDifference.js'
import * as GetNamedFunctionCount from '../GetNamedFunctionCount/GetNamedFunctionCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.js'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.js'

export const id = MeasureId.NamedFunctionDifferenceWithSourceMap

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  const scriptHandler = ScriptHandler.create()
  return [session, objectGroup, scriptHandler]
}

export const start = async (session, objectGroup, scriptHandler) => {
  await scriptHandler.start(session)
  return GetNamedFunctionCount.getNamedFunctionCount(session, objectGroup, scriptHandler.scriptMap)
}

export const stop = async (session, objectGroup, scriptHandler) => {
  await scriptHandler.stop(session)
  const result = await GetNamedFunctionCount.getNamedFunctionCount(session, objectGroup, scriptHandler.scriptMap)
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
  return result
}

export const compare = CompareFunctionDifference.compareFunctionDifference

export const isLeak = (difference) => {
  return difference.length > 0
}
