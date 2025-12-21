import type { IScriptHandler } from '../IScriptHandler/IScriptHandler.ts'
import * as CompareNamedFunctionDifferenceWithSourceMap from '../CompareNamedFunctionDifferenceWithSourceMap/CompareNamedFunctionDifferenceWithSourceMap.ts'
import * as GetNamedFunctionCount from '../GetNamedFunctionCount/GetNamedFunctionCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.NamedFunctionDifferenceWithSourceMap

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  const scriptHandler = ScriptHandler.create()
  return [session, objectGroup, scriptHandler]
}

const includeSourceMap = true

export const start = async (session, objectGroup, scriptHandler: IScriptHandler) => {
  await scriptHandler.start(session)
  return GetNamedFunctionCount.getNamedFunctionCount(session, objectGroup, scriptHandler.scriptMap, includeSourceMap)
}

export const stop = async (session, objectGroup, scriptHandler: IScriptHandler) => {
  await scriptHandler.stop(session)
  const result = await GetNamedFunctionCount.getNamedFunctionCount(session, objectGroup, scriptHandler.scriptMap, includeSourceMap)
  // @ts-ignore
  result.scriptMap = scriptHandler.scriptMap
  return result
}

export const releaseResources = async (session, objectGroup) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
}

export const compare = CompareNamedFunctionDifferenceWithSourceMap.compareFunctionDifference

export const isLeak = (difference) => {
  return difference.length > 0
}
