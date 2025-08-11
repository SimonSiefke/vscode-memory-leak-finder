import * as CompareFunctionDifference from '../CompareFunctionDifference/CompareFunctionDifference.ts'
import * as GetNamedFunctionCount from '../GetNamedFunctionCount/GetNamedFunctionCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'

export const id = MeasureId.NamedFunctionDifference

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  const scriptHandler = ScriptHandler.create()
  return [session, objectGroup, scriptHandler]
}

const includeSourceMap = false

export const start = async (session, objectGroup, scriptHandler) => {
  await scriptHandler.start(session)
  return GetNamedFunctionCount.getNamedFunctionCount(session, objectGroup, scriptHandler.scriptMap, includeSourceMap)
}

export const stop = async (session, objectGroup, scriptHandler) => {
  await scriptHandler.stop(session)
  const result = await GetNamedFunctionCount.getNamedFunctionCount(session, objectGroup, scriptHandler.scriptMap, includeSourceMap)
  return result
}

export const releaseResources = async (session, objectGroup) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
}

export const compare = CompareFunctionDifference.compareFunctionDifference

export const isLeak = (difference) => {
  return difference.length > 0
}
