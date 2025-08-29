import type { IScriptHandler } from '../IScriptHandler/IScriptHandler.ts'
import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetUserStringCount from '../GetUserStringCount/GetUserStringCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as TargetId from '../TargetId/TargetId.ts'
import * as WriteScriptMap from '../WriteScriptMap/WriteScriptMap.ts'

export const id = MeasureId.UserStringCount

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  const scriptHandler = ScriptHandler.create()
  return [session, objectGroup, scriptHandler]
}

export const start = async (session, objectGroup, scriptHandler: IScriptHandler) => {
  await scriptHandler.start(session)
  const id = 0
  const result = await GetUserStringCount.getUserStringCount(session, objectGroup, id)
  await WriteScriptMap.writeScriptMap(scriptHandler.scriptMap, id)
  return result
}

export const stop = async (session, objectGroup, scriptHandler: IScriptHandler) => {
  const id = 1
  const result = await GetUserStringCount.getUserStringCount(session, objectGroup, id)
  await WriteScriptMap.writeScriptMap(scriptHandler.scriptMap, id)
  await scriptHandler.stop(session)
  return result
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
