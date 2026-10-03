import type { Dynamic } from '../Types/Types.ts'
import type { IScriptHandler } from '../IScriptHandler/IScriptHandler.ts'
import type { Session } from '../Session/Session.ts'
import * as Arrays from '../Arrays/Arrays.ts'
import * as CompareInstanceCountsWithSourceMap from '../CompareInstanceCountsWithSourceMap/CompareInstanceCountsWithSourceMap.ts'
import * as GetInstanceCountsWithSourceMap from '../GetInstanceCountsWithSourceMap/GetInstanceCountsWithSourceMap.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as TargetId from '../TargetId/TargetId.ts'
export const id = MeasureId.InstanceCountsWithSourceMap
export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]
export const create = (session: Session) => {
  const objectGroup = ObjectGroupId.create()
  const scriptHandler = ScriptHandler.create()
  return [session, objectGroup, scriptHandler]
}
export const start = async (session: Session, objectGroup: Dynamic, scriptHandler: IScriptHandler) => {
  await scriptHandler.start(session)
  return GetInstanceCountsWithSourceMap.getInstanceCountsWithSourceMap(session, objectGroup, scriptHandler.scriptMap)
}
export const stop = async (session: Session, objectGroup: Dynamic, scriptHandler: IScriptHandler) => {
  await scriptHandler.stop(session)
  return GetInstanceCountsWithSourceMap.getInstanceCountsWithSourceMap(session, objectGroup, scriptHandler.scriptMap)
}
export const compare = CompareInstanceCountsWithSourceMap.compareInstanceCountsWithSourceMap
const getCount = (value: Dynamic) => {
  return value.count
}
const getTotalCount = (instances: Dynamic) => {
  return Arrays.sum(instances.map(getCount))
}
export const isLeak = ({ after, before }: Dynamic) => {
  return getTotalCount(after) > getTotalCount(before)
}
