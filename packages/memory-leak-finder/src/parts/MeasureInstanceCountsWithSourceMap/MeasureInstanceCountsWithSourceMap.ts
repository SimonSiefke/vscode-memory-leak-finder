import * as Arrays from '../Arrays/Arrays.ts'
import * as CompareInstanceCountsWithSourceMap from '../CompareInstanceCountsWithSourceMap/CompareInstanceCountsWithSourceMap.ts'
import * as GetInstanceCountsWithSourceMap from '../GetInstanceCountsWithSourceMap/GetInstanceCountsWithSourceMap.ts'
import type { IScriptHandler } from '../IScriptHandler/IScriptHandler.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.InstanceCountsWithSourceMap

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

export const compare = CompareInstanceCountsWithSourceMap.compareInstanceCountsWithSourceMap

const getCount = (value) => {
  return value.count
}

const getTotalCount = (instances) => {
  return Arrays.sum(instances.map(getCount))
}

export const isLeak = ({ before, after }) => {
  return getTotalCount(after) > getTotalCount(before)
}
