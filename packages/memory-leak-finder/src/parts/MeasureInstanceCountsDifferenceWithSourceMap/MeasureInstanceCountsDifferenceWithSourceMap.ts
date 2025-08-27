import type { IScriptHandler } from '../IScriptHandler/IScriptHandler.ts'
import * as CompareInstanceCountsDifferenceWithSourceMap from '../CompareInstanceCountsDifferenceWithSourceMap/CompareInstanceCountsDifferenceWithSourceMap.ts'
import * as GetInstanceCountsWithSourceMap from '../GetInstanceCountsWithSourceMap/GetInstanceCountsWithSourceMap.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.InstanceCountsDifferenceWithSourceMap

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  const scriptHandler = ScriptHandler.create()
  return [session, objectGroup, scriptHandler]
}

export const start = async (session, objectGroup, scriptHandler: IScriptHandler) => {
  await scriptHandler.start(session)
  return GetInstanceCountsWithSourceMap.getInstanceCountsWithSourceMap(session, objectGroup, scriptHandler.scriptMap)
}

export const stop = async (session, objectGroup, scriptHandler: IScriptHandler) => {
  await scriptHandler.stop(session)
  return GetInstanceCountsWithSourceMap.getInstanceCountsWithSourceMap(session, objectGroup, scriptHandler.scriptMap)
}

// TODO can improve performance by only querying
// constructor locations that have increased
// instead of querying constructor locations for all instances
export const compare = CompareInstanceCountsDifferenceWithSourceMap.compareInstanceCountsDifferenceWithSourceMap

export const isLeak = (leaked) => {
  return leaked.length > 0
}
