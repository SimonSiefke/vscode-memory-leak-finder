import * as Arrays from '../Arrays/Arrays.js'
import * as CompareInstanceCountsWithSourceMap from '../CompareInstanceCountsWithSourceMap/CompareInstanceCountsWithSourceMap.js'
import * as GetInstanceCountsWithSourceMap from '../GetInstanceCountsWithSourceMap/GetInstanceCountsWithSourceMap.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.js'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.js'

export const id = MeasureId.InstanceCountsWithSourceMap

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

export const releaseResources = async (session, objectGroup) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
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
