import * as CompareInstanceCountsDifferenceWithSourceMap from '../CompareInstanceCountsDifferenceWithSourceMap/CompareInstanceCountsDifferenceWithSourceMap.js'
import * as GetInstanceCountsWithSourceMap from '../GetInstanceCountsWithSourceMap/GetInstanceCountsWithSourceMap.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.js'

export const id = MeasureId.InstanceCountsDifferenceWithSourceMap

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  const scriptHandler = ScriptHandler.create()
  return [session, objectGroup, scriptHandler]
}

export const start = async (session, objectGroup, scriptHandler) => {
  await scriptHandler.start(session)
  return GetInstanceCountsWithSourceMap.getInstanceCountsWithSourceMap(session, objectGroup, scriptHandler.scriptMap)
}

export const stop = async (session, objectGroup, scriptHandler) => {
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
