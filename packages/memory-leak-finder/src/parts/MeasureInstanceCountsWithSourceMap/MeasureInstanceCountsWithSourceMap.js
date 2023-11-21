import * as Arrays from '../Arrays/Arrays.js'
import * as CompareInstanceCountsWithSourceMap from '../CompareInstanceCountsWithSourceMap/CompareInstanceCountsWithSourceMap.js'
import * as GetInstanceCountsWithSourceMap from '../GetInstanceCountsWithSourceMap/GetInstanceCountsWithSourceMap.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

export const id = MeasureId.InstanceCountsWithSourceMap

export const requiresDebugger = true

export const create = (session, scriptMap) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup, scriptMap]
}

export const start = async (session, objectGroup, scriptMap) => {
  return GetInstanceCountsWithSourceMap.getInstanceCountsWithSourceMap(session, objectGroup, scriptMap)
}

export const stop = async (session, objectGroup, scriptMap) => {
  return GetInstanceCountsWithSourceMap.getInstanceCountsWithSourceMap(session, objectGroup, scriptMap)
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
